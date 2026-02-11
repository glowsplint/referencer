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
});

test("arrow endpoints are highlighted with layer color after drawing", async ({ page }) => {
  // Draw an arrow: hold 'a', move right, release 'a'
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");

  // Arrow should be drawn
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Clear selection to count highlights cleanly
  const hr = page.locator('.simple-editor [data-type="horizontalRule"]').first();
  await hr.click();
  await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

  // Both arrow endpoints should be highlighted with background-color
  // (committed highlight from beforeEach + 2 arrow endpoints, but the
  // committed highlight overlaps with one endpoint, so we see 2 distinct spans)
  const highlightSpans = page.locator('.simple-editor span[style*="background-color"]');
  await expect(highlightSpans).toHaveCount(2, { timeout: 2000 });

  // Each highlight should contain the layer's color (rgba with 0.3 opacity)
  for (let i = 0; i < 2; i++) {
    const style = await highlightSpans.nth(i).getAttribute("style");
    expect(style).toContain("background-color");
    expect(style).toContain("rgba");
    expect(style).toContain("0.3");
  }
});

test("arrow endpoint highlights disappear when layer is hidden", async ({ page }) => {
  // Draw an arrow
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Clear selection to count highlights cleanly
  const hr = page.locator('.simple-editor [data-type="horizontalRule"]').first();
  await hr.click();
  await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

  const highlightSpans = page.locator('.simple-editor span[style*="background-color"]');
  await expect(highlightSpans).toHaveCount(2, { timeout: 2000 });

  // Toggle layer visibility off
  await page.getByTestId("layerVisibility-0").click();
  await expect(highlightSpans).toHaveCount(0, { timeout: 2000 });

  // Toggle layer visibility back on
  await page.getByTestId("layerVisibility-0").click();
  await expect(highlightSpans).toHaveCount(2, { timeout: 2000 });
});

test("arrow endpoint highlights disappear when unlocked", async ({ page }) => {
  // Draw an arrow
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Clear selection to count highlights cleanly
  const hr = page.locator('.simple-editor [data-type="horizontalRule"]').first();
  await hr.click();
  await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

  const highlightSpans = page.locator('.simple-editor span[style*="background-color"]');
  await expect(highlightSpans).toHaveCount(2, { timeout: 2000 });

  // Unlock editor — highlights should disappear
  await page.getByTestId("lockButton").click();
  await expect(highlightSpans).toHaveCount(0, { timeout: 2000 });

  // Lock again — highlights should reappear
  await page.getByTestId("lockButton").click();
  await expect(highlightSpans).toHaveCount(2, { timeout: 2000 });
});
