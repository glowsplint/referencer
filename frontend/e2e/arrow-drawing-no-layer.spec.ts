import { test, expect } from "@playwright/test";

test("shows error toast when drawing without an active layer", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".simple-editor p").first()).toBeVisible();

  // Lock the editor (no layer created)
  await page.getByTestId("lockButton").click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

  // Click a word to start selection
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Try to draw an arrow
  await page.keyboard.down("a");

  // Toast should appear with error message
  const toast = page.locator("[data-sonner-toast]");
  await expect(toast).toBeVisible({ timeout: 2000 });
  await expect(toast).toContainText("Select a layer before drawing arrows");

  // Should NOT enter drawing mode — no preview arrow
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("preview-arrow")).toHaveCount(0);

  await page.keyboard.up("a");
  await expect(page.getByTestId("arrow-line")).toHaveCount(0);
});
