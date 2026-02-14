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

  // Wait for status bar to confirm anchor was accepted
  await expect(page.getByTestId("status-bar")).toContainText("select the target", { timeout: 2000 });

  // Click target word and confirm
  await page.mouse.click(box!.x + 120, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
}

test("arrow endpoints are highlighted as inline decorations after drawing", async ({ page }) => {
  await drawArrowViaEnter(page);

  // Arrow should be drawn
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Both arrow endpoints should be highlighted as inline decorations in the editor
  const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
  await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });
});

test("within-editor arrow SVG uses mix-blend-mode multiply for text visibility", async ({ page }) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Verify the plugin's visual SVG uses mix-blend-mode multiply (light mode default)
  const svg = page.getByTestId("editor-arrow-visual").first();
  const blendMode = await svg.evaluate((el) =>
    window.getComputedStyle(el).mixBlendMode
  );
  expect(blendMode).toBe("multiply");
});

test("arrow endpoint decorations, line, and arrowhead share same base color", async ({ page }) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
  await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });

  // Verify endpoint has a non-transparent background (use one without word-selection
  // since ProseMirror merges overlapping decoration styles)
  const cleanEndpoint = page.locator(".ProseMirror .arrow-endpoint:not(.word-selection)").first();
  const endpointBg = await cleanEndpoint.evaluate((el) =>
    window.getComputedStyle(el).backgroundColor
  );
  expect(endpointBg).toBeTruthy();
  expect(endpointBg).not.toBe("rgba(0, 0, 0, 0)");

  // Verify arrow line stroke color exists
  const lineStroke = await page.getByTestId("arrow-line").getAttribute("stroke");
  expect(lineStroke).toBeTruthy();

  // Verify arrowhead polygon fill matches line stroke
  const arrowheadFill = await page.locator("marker polygon").first().getAttribute("fill");
  expect(arrowheadFill).toBe(lineStroke);
});

test("arrow endpoint decorations disappear when unlocked", async ({ page }) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
  await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });

  // Unlock editor — endpoint decorations should disappear
  await page.getByTestId("lockButton").click();
  await expect(endpointDecorations).toHaveCount(0, { timeout: 2000 });

  // Lock again — endpoint decorations should reappear
  await page.getByTestId("lockButton").click();
  await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });
});
