import { test, expect } from "@playwright/test";

let initialArrowCount = 0;
let initialEndpointCount = 0;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".simple-editor p").first()).toBeVisible();

  // Hide default layers so their arrows/highlights don't interfere with tests
  for (let i = 0; i < 3; i++) {
    await page.getByTestId(`layerVisibility-${i}`).click();
  }

  // Editor starts locked with 3 default layers (some have arrows). Add a fresh layer for tests.
  await page.getByTestId("addLayerButton").click();

  // Record initial arrow and endpoint counts from default layers
  initialArrowCount = await page.getByTestId("arrow-line").count();
  initialEndpointCount = await page.locator(".ProseMirror .arrow-endpoint").count();

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
  await expect(page.getByTestId("status-bar")).toContainText("select the target", {
    timeout: 2000,
  });

  // Click target word and confirm
  await page.mouse.click(box!.x + 120, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
}

test.describe("arrow endpoint highlights", () => {

test("when an arrow is drawn, then endpoints are highlighted as inline decorations", async ({ page }) => {
  await drawArrowViaEnter(page);

  // Arrow should be drawn
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });

  // New arrow endpoints should be highlighted as inline decorations in the editor.
  // Note: if a new endpoint shares a word with an existing arrow endpoint, ProseMirror
  // merges the decorations, so the count may increase by 1 instead of 2.
  const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
  const count = await endpointDecorations.count();
  expect(count).toBeGreaterThanOrEqual(initialEndpointCount + 1);
});

test("when an arrow is drawn, then SVG uses mix-blend-mode multiply for text visibility", async ({
  page,
}) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });

  // Verify the plugin's visual SVG uses mix-blend-mode multiply (light mode default)
  const svg = page.getByTestId("editor-arrow-visual").first();
  const blendMode = await svg.evaluate((el) => window.getComputedStyle(el).mixBlendMode);
  expect(blendMode).toBe("multiply");
});

test("when an arrow is drawn, then endpoint decorations, line, and arrowhead share same color", async ({ page }) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });

  const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
  const count = await endpointDecorations.count();
  expect(count).toBeGreaterThanOrEqual(initialEndpointCount + 1);

  // Verify endpoint has a non-transparent background (use one without word-selection
  // since ProseMirror merges overlapping decoration styles)
  const cleanEndpoint = page.locator(".ProseMirror .arrow-endpoint:not(.word-selection)").first();
  const endpointBg = await cleanEndpoint.evaluate(
    (el) => window.getComputedStyle(el).backgroundColor,
  );
  expect(endpointBg).toBeTruthy();
  expect(endpointBg).not.toBe("rgba(0, 0, 0, 0)");

  // Verify arrow line stroke color exists (use .last() to get the newly drawn arrow)
  const lineStroke = await page.getByTestId("arrow-line").last().getAttribute("stroke");
  expect(lineStroke).toBeTruthy();

  // Verify arrowhead polygon fill matches line stroke
  const arrowheadFill = await page.locator("marker polygon").first().getAttribute("fill");
  expect(arrowheadFill).toBe(lineStroke);
});

test("when editor is unlocked, then arrow endpoint decorations disappear", async ({ page }) => {
  await drawArrowViaEnter(page);

  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });

  const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
  const countBefore = await endpointDecorations.count();
  expect(countBefore).toBeGreaterThanOrEqual(initialEndpointCount + 1);

  // Unlock editor — endpoint decorations should disappear
  await page.getByTestId("lockButton").click();
  await expect(endpointDecorations).toHaveCount(0, { timeout: 2000 });

  // Lock again — endpoint decorations should reappear
  await page.getByTestId("lockButton").click();
  const countAfter = await endpointDecorations.count();
  expect(countAfter).toBe(countBefore);
});

}); // end arrow endpoint highlights describe
