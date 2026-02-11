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

test("holding 'a' + arrow keys shows dashed preview arrow", async ({ page }) => {
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");

  // Preview arrow should appear in the DOM
  const preview = page.getByTestId("preview-arrow");
  await expect(preview).toHaveCount(1, { timeout: 2000 });

  const dashArray = await preview.getAttribute("stroke-dasharray");
  expect(dashArray).toBe("6 4");

  await page.keyboard.up("a");
});

test("releasing 'a' finalizes arrow (solid line appears, preview disappears)", async ({ page }) => {
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");

  await expect(page.getByTestId("preview-arrow")).toHaveCount(1, { timeout: 2000 });

  // Release 'a' to finalize
  await page.keyboard.up("a");

  // Solid arrow line should appear
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });
  // Preview should disappear
  await expect(page.getByTestId("preview-arrow")).toHaveCount(0, { timeout: 2000 });
});

test("no arrow created when 'a' released without moving", async ({ page }) => {
  await page.keyboard.down("a");
  await page.keyboard.up("a");

  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });
});

test("multiple arrows can be drawn sequentially", async ({ page }) => {
  // Draw first arrow
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Draw second arrow from current position
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");
  await expect(page.getByTestId("arrow-line")).toHaveCount(2, { timeout: 2000 });
});

test("click on arrow line deletes it", async ({ page }) => {
  // Draw an arrow
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Click hit area to delete
  const hitArea = page.getByTestId("arrow-hit-area");
  await hitArea.click({ force: true });
  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });
});

test("layer visibility toggle hides/shows arrows", async ({ page }) => {
  // Draw an arrow
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");

  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Toggle layer visibility off
  await page.getByTestId("layerVisibility-0").click();
  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });

  // Toggle layer visibility back on
  await page.getByTestId("layerVisibility-0").click();
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });
});
