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

async function addAnnotation(
  page: import("@playwright/test").Page,
  text: string
) {
  const input = page.getByPlaceholder("Add annotation...");
  await expect(input).toBeVisible({ timeout: 2000 });
  await input.fill(text);
  await input.press("Enter");
  await expect(page.getByText(text)).toBeVisible({ timeout: 2000 });
}

async function drawArrowRight(
  page: import("@playwright/test").Page,
  steps: number
) {
  await page.keyboard.press("Escape");
  // Switch to arrow tool
  await page.keyboard.press("a");
  // Click current word to set anchor
  const sel = page.locator(".word-selection").first();
  await sel.click({ force: true });
  // Navigate right to destination
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(30);
  }
  // Click destination word to finalize arrow
  const destSel = page.locator(".word-selection").first();
  await destSel.click({ force: true });
  // Switch back to selection tool so subsequent clickWordInEditor won't trigger arrow
  await page.keyboard.press("s");
}

async function editorOfSelection(
  page: import("@playwright/test").Page,
  editorCount: number
) {
  for (let e = 0; e < editorCount; e++) {
    const count = await page
      .locator(".simple-editor-wrapper")
      .nth(e)
      .locator(".word-selection")
      .count();
    if (count > 0) return e;
  }
  return -1;
}

async function drawArrowToEditor(
  page: import("@playwright/test").Page,
  targetEditor: number,
  editorCount: number,
  maxSteps = 80
) {
  await page.keyboard.press("Escape");
  // Switch to arrow tool
  await page.keyboard.press("a");
  // Click current word to set anchor
  const sel = page.locator(".word-selection").first();
  await sel.click({ force: true });
  // Navigate right until reaching target editor
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(30);
    if ((await editorOfSelection(page, editorCount)) === targetEditor) break;
  }
  // Click destination word to finalize arrow
  const destSel = page.locator(".word-selection").first();
  await destSel.click({ force: true });
  // Switch back to selection tool so subsequent clickWordInEditor won't trigger arrow
  await page.keyboard.press("s");
}

test.describe("no dangling highlights when layer is hidden", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("hiding layer removes all highlight decorations for that layer", async ({
    page,
  }) => {
    // Create annotation to persist the highlight
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Highlight test");

    // Clear selection so we can isolate layer highlights
    const hr = page
      .locator('.simple-editor [data-type="horizontalRule"]')
      .first();
    await hr.click();
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });

    // Verify highlight exists
    const highlights = page.locator(
      '.simple-editor span[style*="background-color"]'
    );
    await expect(highlights.first()).toBeVisible({ timeout: 2000 });
    const countBefore = await highlights.count();
    expect(countBefore).toBeGreaterThan(0);

    // Hide layer — all highlights should disappear
    await page.getByTestId("layerVisibility-0").click();
    await expect(highlights).toHaveCount(0, { timeout: 2000 });

    // No annotation panel either
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("hiding layer removes arrow endpoint highlights too", async ({
    page,
  }) => {
    // Draw an arrow
    await clickWordInEditor(page, 0, 30);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Clear selection
    const hr = page
      .locator('.simple-editor [data-type="horizontalRule"]')
      .first();
    await hr.click();
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });

    // Arrow endpoint highlights should exist
    const highlights = page.locator(
      '.simple-editor span[style*="background-color"]'
    );
    const countBefore = await highlights.count();
    expect(countBefore).toBeGreaterThan(0);

    // Hide layer
    await page.getByTestId("layerVisibility-0").click();

    // Both arrows AND highlights should be gone
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(highlights).toHaveCount(0, { timeout: 2000 });
  });
});

test.describe("no dangling elements when passage is hidden", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

    await page.getByTestId("addLayerButton").click();

    // Close management pane for more editor space
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("hiding passage removes annotation panel when only annotation is in that passage", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Passage gone note");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Reopen management pane to toggle
    await page.getByTestId("menuButton").click();

    await page.getByTestId("sectionVisibility-0").click();

    // Annotation panel should disappear completely
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
    // No dangling text
    await expect(page.getByText("Passage gone note")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("cross-editor arrow disappears when destination passage hidden", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0, 30);
    await drawArrowToEditor(page, 1, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Reopen management pane
    await page.getByTestId("menuButton").click();

    // Hide passage 2 (destination)
    await page.getByTestId("sectionVisibility-1").click();

    // Arrow line should be gone (both endpoints must be visible for arrow to render)
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Destination editor should be hidden
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).not.toBeVisible();

    // Show passage 2 again — arrow should reappear
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });
});

test.describe("no orphaned connector lines", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addLayerButton").click();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("connector line count matches annotation card count", async ({
    page,
  }) => {
    // Create first annotation
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Note A");

    // Create second annotation
    await clickWordInEditor(page, 0, 100);
    await addAnnotation(page, "Note B");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Count connector lines in the annotation panel SVG
    const connectorLines = page.locator(
      '[data-testid="annotation-panel"] svg line'
    );
    const lineCount = await connectorLines.count();

    // Count visible annotation cards (divs with absolute positioning in the panel)
    const annotationCards = page.locator(
      '[data-testid="annotation-panel"] .absolute.w-48'
    );
    const cardCount = await annotationCards.count();

    // Each annotation card should have exactly one connector line
    expect(lineCount).toBe(cardCount);
    expect(lineCount).toBe(2);
  });

  test("hiding layer removes both connector lines and cards", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Connector test");

    await expect(
      page.locator('[data-testid="annotation-panel"] svg line')
    ).toHaveCount(1, { timeout: 2000 });

    // Hide layer
    await page.getByTestId("layerVisibility-0").click();

    // Panel should disappear entirely (no orphaned SVG elements)
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
  });
});

test.describe("arrows + highlights + annotations sync during visibility changes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();

    // Activate Layer 1
    await page.getByTestId("layerName-0").click();

    // Close management pane for more space
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("all 3 element types appear and disappear together on layer toggle", async ({
    page,
  }) => {
    // Create arrow on Layer 1
    await clickWordInEditor(page, 0, 30);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Switch back to comments tool after drawing arrow
    await page.keyboard.press("c");

    // Create annotation on Layer 1
    await clickWordInEditor(page, 0, 100);
    await addAnnotation(page, "Synced note");

    // Verify all present
    await expect(page.getByTestId("arrow-line")).toHaveCount(1);
    await expect(page.getByText("Synced note")).toBeVisible();

    // Clear selection to verify highlights
    const hr = page
      .locator('.simple-editor [data-type="horizontalRule"]')
      .first();
    await hr.click();
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });

    const highlights = page.locator(
      '.simple-editor span[style*="background-color"]'
    );
    const highlightsBefore = await highlights.count();
    expect(highlightsBefore).toBeGreaterThan(0);

    // Reopen management pane for layer toggle
    await page.getByTestId("menuButton").click();

    // Hide Layer 1
    await page.getByTestId("layerVisibility-0").click();

    // All should be gone
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(page.getByText("Synced note")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(highlights).toHaveCount(0, { timeout: 2000 });

    // Show Layer 1
    await page.getByTestId("layerVisibility-0").click();

    // All should reappear
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByText("Synced note")).toBeVisible({ timeout: 2000 });
    const highlightsAfter = await highlights.count();
    expect(highlightsAfter).toBe(highlightsBefore);
  });

  test("layer 2 elements unaffected when layer 1 is toggled", async ({
    page,
  }) => {
    // Create annotation on Layer 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "L1 note");

    // Draw arrow on Layer 1
    await clickWordInEditor(page, 0, 100);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Reopen management pane to switch layers
    await page.getByTestId("menuButton").click();

    // Switch to Layer 2
    await page.getByTestId("layerName-1").click();
    await expect(page.getByTestId("layerActiveTag-1")).toBeVisible();

    // Close management pane for more editor space
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    // Switch back to comments tool after drawing arrow
    await page.keyboard.press("c");

    // Create annotation on Layer 2 in passage 2
    await clickWordInEditor(page, 1, 30);
    await addAnnotation(page, "L2 note");

    // Draw arrow on Layer 2 in passage 2
    await clickWordInEditor(page, 1, 100);
    await drawArrowRight(page, 2);

    // Both layers' arrows
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    // Reopen management pane for layer toggle
    await page.getByTestId("menuButton").click();

    // Hide Layer 1
    await page.getByTestId("layerVisibility-0").click();

    // Layer 1 stuff gone, Layer 2 stuff remains
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByText("L1 note")).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByText("L2 note")).toBeVisible({ timeout: 2000 });
  });

  test("rapid layer toggle does not leave dangling elements", async ({
    page,
  }) => {
    // Create arrow + annotation on Layer 1
    await clickWordInEditor(page, 0, 30);
    await drawArrowRight(page, 2);
    // Switch back to comments tool after drawing arrow
    await page.keyboard.press("c");
    await clickWordInEditor(page, 0, 100);
    await addAnnotation(page, "Rapid test");

    // Reopen management pane for layer toggle
    await page.getByTestId("menuButton").click();

    // Rapid toggle 6 times (ends visible)
    for (let i = 0; i < 6; i++) {
      await page.getByTestId("layerVisibility-0").click();
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);

    // Should be in consistent visible state
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByText("Rapid test")).toBeVisible({ timeout: 2000 });
  });

  test("rapid passage toggle does not leave dangling elements", async ({
    page,
  }) => {
    // Create annotation in passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Rapid passage test");

    // Reopen management pane for section toggle
    await page.getByTestId("menuButton").click();

    // Rapid toggle passage 1: 5 times (ends hidden)
    for (let i = 0; i < 5; i++) {
      await page.getByTestId("sectionVisibility-0").click();
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);

    // Passage is hidden, annotation should be gone
    await expect(page.getByText("Rapid passage test")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show passage — annotation should come back
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByText("Rapid passage test")).toBeVisible({
      timeout: 2000,
    });
  });
});

test.describe("all elements hidden state", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addLayerButton").click();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("no visible artifacts when all layers are hidden", async ({ page }) => {
    // Create arrow + annotation
    await clickWordInEditor(page, 0, 30);
    await drawArrowRight(page, 2);
    // Switch back to comments tool after drawing arrow
    await page.keyboard.press("c");
    await clickWordInEditor(page, 0, 100);
    await addAnnotation(page, "Will hide");

    // Hide the only layer
    await page.getByTestId("layerVisibility-0").click();

    // Nothing should remain
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(
      page.locator(
        '.simple-editor span[style*="background-color"]:not(.word-selection):not(.similar-text-highlight)'
      )
    ).toHaveCount(0, { timeout: 2000 });

    // Word selection should still work (not layer-dependent)
    await clickWordInEditor(page, 0, 50);
    await expect(page.locator(".word-selection").first()).toBeVisible({
      timeout: 2000,
    });
  });

  test("arrow overlay SVG is empty when no visible arrows", async ({
    page,
  }) => {
    // Draw an arrow
    await clickWordInEditor(page, 0, 30);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide layer
    await page.getByTestId("layerVisibility-0").click();

    // The SVG overlay should exist but contain no arrow path elements
    const arrowOverlay = page.getByTestId("arrow-overlay");
    await expect(arrowOverlay).toBeVisible();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(page.getByTestId("preview-arrow")).toHaveCount(0, {
      timeout: 2000,
    });
  });
});
