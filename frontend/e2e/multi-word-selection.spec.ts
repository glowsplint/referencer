import { test, expect } from "@playwright/test";

async function clickWordInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  xOffset = 30
) {
  const p = page
    .locator(".simple-editor-wrapper")
    .nth(editorIndex)
    .locator("p")
    .first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + xOffset, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection").first()).toBeVisible({
    timeout: 2000,
  });
}

test.describe("multi-word selection with Shift+Arrow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Create a layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    // Lock editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("Shift+ArrowRight expands selection to include next word", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0, 30);
    // Dismiss auto-focused annotation so keyboard reaches word selection handler
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;

    // Shift+ArrowRight to extend selection
    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForTimeout(100);

    const expandedBox = await selection.first().boundingBox();
    expect(expandedBox).not.toBeNull();
    // Selection should be wider (covering more words)
    expect(expandedBox!.width).toBeGreaterThan(initialWidth);
  });

  test("Shift+ArrowLeft expands selection to include previous word", async ({
    page,
  }) => {
    // Click a word that's not the first one (offset further right)
    await clickWordInEditor(page, 0, 100);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;
    const initialX = initialBox!.x;

    // Shift+ArrowLeft to extend selection backward
    await page.keyboard.press("Shift+ArrowLeft");
    await page.waitForTimeout(100);

    const expandedBox = await selection.first().boundingBox();
    expect(expandedBox).not.toBeNull();
    // Selection should be wider and start earlier (lower x)
    expect(expandedBox!.width).toBeGreaterThan(initialWidth);
    expect(expandedBox!.x).toBeLessThan(initialX);
  });

  test("multiple Shift+ArrowRight presses keep expanding", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0, 30);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    const selection = page.locator(".word-selection");
    const box1 = await selection.boundingBox();
    expect(box1).not.toBeNull();

    // Expand 3 times
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Shift+ArrowRight");
      await page.waitForTimeout(50);
    }

    const box2 = await selection.first().boundingBox();
    expect(box2).not.toBeNull();
    expect(box2!.width).toBeGreaterThan(box1!.width);
  });

  test("Shift+Arrow does not extend across editor boundaries", async ({
    page,
  }) => {
    // Add second passage
    await page.getByTestId("lockButton").click();
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Click word in editor 1
    await clickWordInEditor(page, 0, 30);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    // Press Shift+ArrowRight many times to try to cross editor boundary
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("Shift+ArrowRight");
      await page.waitForTimeout(20);
    }

    // Selection should still be in editor 0 (not crossing boundary)
    const selectionInE0 = await page
      .locator(".simple-editor-wrapper")
      .nth(0)
      .locator(".word-selection")
      .count();
    expect(selectionInE0).toBeGreaterThan(0);
  });

  test("normal arrow key after Shift+Arrow resets to single word", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0, 30);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    const singleBox = await page.locator(".word-selection").boundingBox();
    expect(singleBox).not.toBeNull();
    const singleWidth = singleBox!.width;

    // Expand selection
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.waitForTimeout(100);

    const expandedBox = await page.locator(".word-selection").first().boundingBox();
    expect(expandedBox).not.toBeNull();
    expect(expandedBox!.width).toBeGreaterThan(singleWidth);

    // Plain ArrowRight (no shift) — should collapse back to single word
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);

    const collapsedBox = await page.locator(".word-selection").boundingBox();
    expect(collapsedBox).not.toBeNull();
    expect(collapsedBox!.width).toBeLessThan(expandedBox!.width);
  });
});

test.describe("drag-to-select multiple words", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Create a layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    // Lock editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Switch to comments tool for annotation creation
    await page.keyboard.press("c");
  });

  test("dragging across words creates multi-word selection", async ({
    page,
  }) => {
    const p = page.locator(".simple-editor p").first();
    const box = await p.boundingBox();
    expect(box).not.toBeNull();

    // Mouse drag from start to end of some words
    const startX = box!.x + 20;
    const endX = box!.x + 150;
    const y = box!.y + box!.height / 2;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();

    // Should see word-selection decoration(s) covering the drag range
    const selectionCount = await page.locator(".word-selection").count();
    expect(selectionCount).toBeGreaterThan(0);

    // Get the total span of all selection elements
    const firstSel = page.locator(".word-selection").first();
    const lastSel = page.locator(".word-selection").last();
    const firstBox = await firstSel.boundingBox();
    const lastBox = await lastSel.boundingBox();
    expect(firstBox).not.toBeNull();
    expect(lastBox).not.toBeNull();

    // Total selection span should cover multiple words (> 50px)
    const totalWidth = lastBox!.x + lastBox!.width - firstBox!.x;
    expect(totalWidth).toBeGreaterThan(50);
  });

  test("drag selection creates annotation card", async ({ page }) => {
    const p = page.locator(".simple-editor p").first();
    const box = await p.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + 20;
    const endX = box!.x + 150;
    const y = box!.y + box!.height / 2;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();

    // Annotation panel should appear
    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByPlaceholder("Add annotation...")).toBeVisible({
      timeout: 2000,
    });
  });

  test("drag selection highlight has background color", async ({ page }) => {
    const p = page.locator(".simple-editor p").first();
    const box = await p.boundingBox();
    expect(box).not.toBeNull();

    const startX = box!.x + 20;
    const endX = box!.x + 150;
    const y = box!.y + box!.height / 2;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();

    // Save annotation so highlight persists
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill("Drag note");
    await input.press("Enter");

    // Clear selection to see only the decoration highlights
    const hr = page
      .locator('.simple-editor [data-type="horizontalRule"]')
      .first();
    await hr.click();
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });

    // Should have background-color styled spans (highlight decorations)
    const highlights = page.locator(
      '.simple-editor span[style*="background-color"]'
    );
    await expect(highlights.first()).toBeVisible({ timeout: 2000 });
  });
});

test.describe("selection clears on state changes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("unlocking editor clears multi-word selection", async ({ page }) => {
    // Create a layer for the Shift+Arrow selection
    await page.getByTestId("lockButton").click();
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    await clickWordInEditor(page, 0, 30);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    // Expand selection
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");

    const selection = page.locator(".word-selection").first();
    await expect(selection).toBeVisible({ timeout: 2000 });

    // Unlock
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toBeVisible();

    // Selection should be gone
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });
  });
});
