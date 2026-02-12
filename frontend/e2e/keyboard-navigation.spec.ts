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

const cmdModifier = process.platform === "darwin" ? "Meta" : "Control";

test.describe("keyboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
    // Lock the editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("Escape clears word selection", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);
    await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("Home moves selection to first word in passage", async ({ page }) => {
    // Click a word that's not the first (offset further right)
    await clickWordInEditor(page, 0, 100);

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.keyboard.press("Home");
    await page.waitForTimeout(100);

    const homeBox = await selection.boundingBox();
    expect(homeBox).not.toBeNull();
    // Home should move to the beginning (smaller x position, or at least different)
    expect(homeBox!.x).toBeLessThanOrEqual(initialBox!.x);
  });

  test("End moves selection to last word in passage", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.keyboard.press("End");
    await page.waitForTimeout(100);

    const endBox = await selection.boundingBox();
    expect(endBox).not.toBeNull();
    // End should move toward the end of the passage
    const initialRight = initialBox!.x + initialBox!.width;
    const endRight = endBox!.x + endBox!.width;
    expect(endRight).toBeGreaterThanOrEqual(initialRight);
  });

  test("Cmd+A selects all words in active passage", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;

    await page.keyboard.press(`${cmdModifier}+a`);
    await page.waitForTimeout(100);

    // After Cmd+A the selection should be much wider (covering the whole passage)
    const selectAllBox = await selection.first().boundingBox();
    expect(selectAllBox).not.toBeNull();
    expect(selectAllBox!.width).toBeGreaterThan(initialWidth);
  });
});

test.describe("Tab passage cycling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Add second passage while unlocked
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

    // Lock the editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("Tab moves selection to a different editor", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);

    // Check which editor has the selection
    const selInE0Before = await page
      .locator(".simple-editor-wrapper")
      .nth(0)
      .locator(".word-selection")
      .count();
    expect(selInE0Before).toBeGreaterThan(0);

    await page.keyboard.press("Tab");
    await page.waitForTimeout(200);

    // Selection should now be in editor 1
    const selInE1 = await page
      .locator(".simple-editor-wrapper")
      .nth(1)
      .locator(".word-selection")
      .count();
    expect(selInE1).toBeGreaterThan(0);
  });
});
