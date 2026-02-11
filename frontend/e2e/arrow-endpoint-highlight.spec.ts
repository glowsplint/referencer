import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".simple-editor p").first()).toBeVisible();

  // Create a layer
  await expect(page.getByTestId("managementPane")).toBeVisible();
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

  // Lock the editor
  await page.getByTestId("lockButton").click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

  // Click a word to start selection
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Dismiss auto-focused annotation input so arrow keys navigate words
  await page.keyboard.press("Escape");

  // Switch to arrow tool
  await page.keyboard.press("a");
});

test("arrow endpoints are highlighted as SVG rects after drawing", async ({ page }) => {
  // Click current word to set anchor
  const sel = page.locator(".word-selection").first();
  await sel.click({ force: true });
  // Navigate right to destination
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(30);
  // Click destination word to finalize arrow
  const destSel = page.locator(".word-selection").first();
  await destSel.click({ force: true });

  // Arrow should be drawn
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Both arrow endpoints should be highlighted as SVG rects in the overlay
  const endpointRects = page.locator('[data-testid="arrow-endpoint-rect"]');
  await expect(endpointRects).toHaveCount(2, { timeout: 2000 });
});

test("arrow endpoint SVG rects disappear when layer is hidden", async ({ page }) => {
  // Click current word to set anchor
  const sel = page.locator(".word-selection").first();
  await sel.click({ force: true });
  // Navigate right to destination
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(30);
  // Click destination word to finalize arrow
  const destSel = page.locator(".word-selection").first();
  await destSel.click({ force: true });

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  const endpointRects = page.locator('[data-testid="arrow-endpoint-rect"]');
  await expect(endpointRects).toHaveCount(2, { timeout: 2000 });

  // Toggle layer visibility off
  await page.getByTestId("layerVisibility-0").click();
  await expect(endpointRects).toHaveCount(0, { timeout: 2000 });

  // Toggle layer visibility back on
  await page.getByTestId("layerVisibility-0").click();
  await expect(endpointRects).toHaveCount(2, { timeout: 2000 });
});

test("arrow endpoint SVG rects disappear when unlocked", async ({ page }) => {
  // Click current word to set anchor
  const sel = page.locator(".word-selection").first();
  await sel.click({ force: true });
  // Navigate right to destination
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(30);
  // Click destination word to finalize arrow
  const destSel = page.locator(".word-selection").first();
  await destSel.click({ force: true });

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  const endpointRects = page.locator('[data-testid="arrow-endpoint-rect"]');
  await expect(endpointRects).toHaveCount(2, { timeout: 2000 });

  // Unlock editor — endpoint rects should disappear
  await page.getByTestId("lockButton").click();
  await expect(endpointRects).toHaveCount(0, { timeout: 2000 });

  // Lock again — endpoint rects should reappear
  await page.getByTestId("lockButton").click();
  await expect(endpointRects).toHaveCount(2, { timeout: 2000 });
});
