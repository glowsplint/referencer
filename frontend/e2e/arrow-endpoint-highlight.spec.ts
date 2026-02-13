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

  // Switch to arrow tool
  await page.keyboard.press("a");
});

async function drawArrowViaEnter(page: import("@playwright/test").Page) {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();

  // Click anchor word and confirm
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");

  // Click target word and confirm
  await page.mouse.click(box!.x + 120, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
}

test("arrow endpoints are highlighted as SVG rects after drawing", async ({ page }) => {
  await drawArrowViaEnter(page);

  // Arrow should be drawn
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Both arrow endpoints should be highlighted as SVG rects in the overlay
  const endpointRects = page.locator('[data-testid="arrow-endpoint-rect"]');
  await expect(endpointRects).toHaveCount(2, { timeout: 2000 });
});

test("arrow overlay uses mix-blend-mode multiply for text visibility", async ({ page }) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Verify the SVG overlay uses mix-blend-mode multiply (light mode default)
  const svg = page.getByTestId("arrow-overlay");
  const blendMode = await svg.evaluate((el) =>
    window.getComputedStyle(el).mixBlendMode
  );
  expect(blendMode).toBe("multiply");
});

test("arrow endpoint rects, line, and arrowhead share same base color", async ({ page }) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  const endpointRects = page.locator('[data-testid="arrow-endpoint-rect"]');
  await expect(endpointRects).toHaveCount(2, { timeout: 2000 });

  // Get the layer color from the first endpoint rect
  const rectFill = await endpointRects.first().getAttribute("fill");
  expect(rectFill).toBeTruthy();

  // Verify second rect has same fill
  const rectFill2 = await endpointRects.nth(1).getAttribute("fill");
  expect(rectFill2).toBe(rectFill);

  // Verify arrow line stroke matches
  const lineStroke = await page.getByTestId("arrow-line").getAttribute("stroke");
  expect(lineStroke).toBe(rectFill);

  // Verify arrowhead polygon fill matches
  const arrowheadFill = await page.locator("marker polygon").first().getAttribute("fill");
  expect(arrowheadFill).toBe(rectFill);
});

test("arrow endpoint SVG rects disappear when unlocked", async ({ page }) => {
  await drawArrowViaEnter(page);

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
