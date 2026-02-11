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

test("clicking two different words draws an arrow between them", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();

  // Click first word (sets anchor)
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Navigate to see preview (keyboard nav updates preview but doesn't finalize)
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowRight");
  const preview = page.getByTestId("preview-arrow");
  await expect(preview).toHaveCount(1, { timeout: 2000 });

  // Click second word (creates arrow)
  await page.mouse.click(box!.x + 120, box!.y + box!.height / 2);

  // Solid arrow line should appear
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });
  // Preview should disappear
  await expect(page.getByTestId("preview-arrow")).toHaveCount(0, { timeout: 2000 });
});

test("no arrow created when clicking same word twice", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();

  // Click first word (sets anchor)
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Click same word again (cancels)
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });
});

test("multiple arrows can be drawn sequentially", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;

  // Draw first arrow: click word1, click word2
  await page.mouse.click(box!.x + 30, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.mouse.click(box!.x + 120, y);
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Draw second arrow: click word2 (new anchor), click word3
  await page.mouse.click(box!.x + 120, y);
  await page.mouse.click(box!.x + 200, y);
  await expect(page.getByTestId("arrow-line")).toHaveCount(2, { timeout: 2000 });
});

test("click on arrow line deletes it", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;

  // Draw an arrow
  await page.mouse.click(box!.x + 30, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.mouse.click(box!.x + 120, y);
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Switch to selection tool before clicking hit area
  await page.keyboard.press("s");

  // Click the arrow midpoint area (no force — tests real pointer events)
  const arrowLine = page.getByTestId("arrow-line");
  const arrowBox = await arrowLine.boundingBox();
  expect(arrowBox).not.toBeNull();
  const midX = arrowBox!.x + arrowBox!.width / 2;
  const midY = arrowBox!.y + arrowBox!.height / 2;
  await page.mouse.click(midX, midY);
  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });
});

test("hovering arrow midpoint shows X icon, clicking deletes arrow", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;

  // Draw an arrow between two words
  const x1 = box!.x + 30;
  const x2 = box!.x + 120;
  await page.mouse.click(x1, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.mouse.click(x2, y);
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Switch to selection tool
  await page.keyboard.press("s");

  // Move mouse away, then hover the arrow hit area
  await page.mouse.move(0, 0);
  const hitArea = page.getByTestId("arrow-hit-area");
  const hitBox = await hitArea.boundingBox();
  expect(hitBox).not.toBeNull();
  const hoverX = hitBox!.x + hitBox!.width / 2;
  const hoverY = hitBox!.y + hitBox!.height / 2;
  await page.mouse.move(hoverX, hoverY, { steps: 5 });

  // X icon circle should appear in the interaction layer
  const interactionLayer = page.getByTestId("arrow-interaction-layer");
  await expect(interactionLayer.locator("circle")).toHaveCount(1, { timeout: 2000 });

  // Click the hit area to delete
  await page.mouse.click(hoverX, hoverY);
  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });
});

test("layer visibility toggle hides/shows arrows", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;

  // Draw an arrow
  await page.mouse.click(box!.x + 30, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.mouse.click(box!.x + 120, y);
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Toggle layer visibility off
  await page.getByTestId("layerVisibility-0").click();
  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });

  // Toggle layer visibility back on
  await page.getByTestId("layerVisibility-0").click();
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });
});

test("arrow tool button shows depressed state when active", async ({ page }) => {
  const arrowBtn = page.getByTestId("arrowToolButton");
  await expect(arrowBtn).toHaveClass(/bg-accent/, { timeout: 2000 });
});
