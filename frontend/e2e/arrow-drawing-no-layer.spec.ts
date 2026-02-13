import { test, expect } from "@playwright/test";

test("shows error toast when drawing without an active layer", async ({ page }) => {
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

  // Press Enter to confirm anchor — triggers layer check
  await page.keyboard.press("Enter");

  // Toast should appear with error message
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Add a new layer before drawing arrows" });
  await expect(toast).toBeVisible({ timeout: 2000 });

  // Should NOT enter drawing mode — no preview arrow
  await expect(page.getByTestId("preview-arrow")).toHaveCount(0);
  await expect(page.getByTestId("arrow-line")).toHaveCount(0);
});
