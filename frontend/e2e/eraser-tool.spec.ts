import { test, expect } from "@playwright/test";

async function clickWordInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  xOffset = 30,
) {
  const p = page.locator(".simple-editor-wrapper").nth(editorIndex).locator("p").first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + xOffset, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection").first()).toBeVisible({
    timeout: 2000,
  });
}

/** Click a word in the editor without waiting for word-selection (used by eraser drag mode) */
async function clickWordInEditorRaw(
  page: import("@playwright/test").Page,
  editorIndex: number,
  xOffset = 30,
) {
  const p = page.locator(".simple-editor-wrapper").nth(editorIndex).locator("p").first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + xOffset, box!.y + box!.height / 2);
}

test.describe("when using the eraser tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 3 default layers. Add a fresh layer for tests.
    await page.getByTestId("addLayerButton").click();
  });

  test("when E key is pressed, then eraser tool is activated", async ({ page }) => {
    await page.keyboard.press("e");
    await expect(page.getByTestId("eraserToolButton")).toHaveClass(/bg-accent/, {
      timeout: 2000,
    });
  });

  test("when eraser clicks on a highlight, then it is removed", async ({ page }) => {
    // Record initial highlight count from default layers
    const highlights = page.locator(
      '.simple-editor-wrapper .ProseMirror span[style*="background-color"]',
    );
    const initialHighlightCount = await highlights.count();

    // First create a highlight
    await page.keyboard.press("h");
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Clear selection so word-selection span doesn't interfere
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    // Verify highlight was created (at least one more than before)
    const afterCreate = await highlights.count();
    expect(afterCreate).toBeGreaterThanOrEqual(initialHighlightCount + 1);

    // Switch to eraser
    await page.keyboard.press("e");

    // Click the same word — eraser now erases on mousedown directly (no Enter needed)
    await clickWordInEditorRaw(page, 0, 30);

    // Highlight count should decrease back
    await expect(highlights).toHaveCount(afterCreate - 1, { timeout: 2000 });
  });

  test("when eraser clicks on an underline, then it is removed", async ({ page }) => {
    // Record initial underline count from default layers
    const underlines = page.locator(
      '.simple-editor-wrapper .ProseMirror span[style*="text-decoration"]',
    );
    const initialUnderlineCount = await underlines.count();

    // First create an underline
    await page.keyboard.press("u");
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Verify underline was created (at least one more than before)
    const afterCreate = await underlines.count();
    expect(afterCreate).toBeGreaterThanOrEqual(initialUnderlineCount + 1);

    // Switch to eraser
    await page.keyboard.press("e");

    // Click the same word — eraser now erases on mousedown directly
    await clickWordInEditorRaw(page, 0, 30);

    // Underline count should decrease back
    await expect(underlines).toHaveCount(afterCreate - 1, { timeout: 2000 });
  });

  test("when eraser is used on a hidden layer's position, then decorations on that layer are not affected", async ({
    page,
  }) => {
    // Record initial highlight count from default layers
    const highlights = page.locator(
      '.simple-editor-wrapper .ProseMirror span[style*="background-color"]',
    );
    const initialHighlightCount = await highlights.count();

    // Create highlight on the test layer (index 3)
    await page.keyboard.press("h");
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Clear selection
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    const afterCreate = await highlights.count();
    expect(afterCreate).toBeGreaterThanOrEqual(initialHighlightCount + 1);

    // Hide the test layer (index 3) — its highlight should disappear
    await page.getByTestId("layerVisibility-3").click();
    const afterHide = await highlights.count();
    expect(afterHide).toBe(afterCreate - 1);

    // Switch to eraser and try to erase at same position (mousedown erases directly)
    await page.keyboard.press("e");
    await clickWordInEditorRaw(page, 0, 30);

    // Show the test layer — highlight should still be there since layer was hidden during erase
    await page.getByTestId("layerVisibility-3").click();
    const afterShow = await highlights.count();
    expect(afterShow).toBe(afterCreate);
  });

  test("when eraser tool is active, then status bar shows eraser message", async ({ page }) => {
    await page.keyboard.press("e");
    await expect(page.getByTestId("status-bar")).toContainText(
      "Click and drag to erase annotations.",
      { timeout: 2000 },
    );
  });
});
