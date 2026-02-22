import { test, expect } from "@playwright/test";

// Skipped: with default Bible study workspace, there are always 4 pre-populated layers
// so the "no active layer" scenario can't be reached through normal UI interaction.
test.skip("auto-creates a layer when drawing without an active layer", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".simple-editor p").first()).toBeVisible();

  // Lock the editor (no layer created)
  await page.getByTestId("lockButton").click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

  // Switch to arrow tool
  await page.keyboard.press("a");

  // Click a word to start selection
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Press Enter to confirm anchor — should auto-create a layer
  await page.keyboard.press("Enter");

  // A layer should have been created in the management pane
  const layerRow = page.getByTestId("layerRow");
  await expect(layerRow).toHaveCount(1, { timeout: 2000 });

  // Should enter drawing mode (anchor confirmed, waiting for target)
  // No toast warning should appear
  const warningToast = page
    .locator("[data-sonner-toast]")
    .filter({ hasText: "Add a new layer before drawing arrows" });
  await expect(warningToast).toHaveCount(0);
});
