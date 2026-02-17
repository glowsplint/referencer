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

test.describe("eraser tool", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Create a layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    // Lock the editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("E key activates eraser tool", async ({ page }) => {
    await page.keyboard.press("e");
    await expect(page.getByTestId("eraserToolButton")).toHaveClass(/bg-accent/, {
      timeout: 2000,
    });
  });

  test("eraser removes a highlight when clicking on it", async ({ page }) => {
    // First create a highlight
    await page.keyboard.press("h");
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Clear selection so word-selection span doesn't interfere
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    // Verify highlight was created
    const highlights = page.locator(
      '.simple-editor-wrapper .ProseMirror span[style*="background-color"]'
    );
    await expect(highlights).toHaveCount(1, { timeout: 2000 });

    // Switch to eraser
    await page.keyboard.press("e");

    // Click the same word to erase
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Clear selection again to isolate check
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    // Highlight should be gone
    await expect(highlights).toHaveCount(0, { timeout: 2000 });
  });

  test("eraser removes an underline when clicking on it", async ({ page }) => {
    // First create an underline
    await page.keyboard.press("u");
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Verify underline was created
    const underlines = page.locator(
      '.simple-editor-wrapper .ProseMirror span[style*="text-decoration"]'
    );
    await expect(underlines).toHaveCount(1, { timeout: 2000 });

    // Switch to eraser
    await page.keyboard.press("e");

    // Click the same word to erase
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Underline should be gone
    await expect(underlines).toHaveCount(0, { timeout: 2000 });
  });

  test("eraser does not affect decorations on hidden layers", async ({ page }) => {
    // Create highlight on Layer 1
    await page.keyboard.press("h");
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Clear selection
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    const highlights = page.locator(
      '.simple-editor-wrapper .ProseMirror span[style*="background-color"]'
    );
    await expect(highlights).toHaveCount(1, { timeout: 2000 });

    // Hide Layer 1
    await page.getByTestId("layerVisibility-0").click();
    await expect(highlights).toHaveCount(0, { timeout: 2000 });

    // Switch to eraser and try to erase at same position
    await page.keyboard.press("e");
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");

    // Clear selection
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    // Show Layer 1 — highlight should still be there since layer was hidden during erase
    await page.getByTestId("layerVisibility-0").click();
    await expect(highlights).toHaveCount(1, { timeout: 2000 });
  });

  test("status bar shows eraser message when tool is active", async ({ page }) => {
    await page.keyboard.press("e");
    await expect(page.getByTestId("status-bar")).toContainText(
      "Click on a highlight or underline to erase it",
      { timeout: 2000 }
    );
  });
});
