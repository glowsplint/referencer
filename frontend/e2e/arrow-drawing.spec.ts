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

test("selecting two different words and pressing Enter draws an arrow", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();

  // Click first word (sets selection)
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Press Enter to confirm anchor
  await page.keyboard.press("Enter");

  // Click second word (sets target selection, preview arrow should appear)
  await page.mouse.click(box!.x + 120, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  const preview = page.getByTestId("preview-arrow");
  await expect(preview).toHaveCount(1, { timeout: 2000 });

  // Press Enter to confirm target and create arrow
  await page.keyboard.press("Enter");

  // Solid arrow line should appear
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });
  // Preview should disappear
  await expect(page.getByTestId("preview-arrow")).toHaveCount(0, { timeout: 2000 });
});

test("no arrow created when confirming same word twice", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();

  // Click first word (sets selection)
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Press Enter to confirm anchor
  await page.keyboard.press("Enter");

  // Click same word again
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Press Enter — same word as anchor, should cancel
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });
});

test("click on arrow line deletes it", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  const y = box!.y + box!.height / 2;

  // Draw an arrow: select word, Enter, select target, Enter
  await page.mouse.click(box!.x + 30, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await page.mouse.click(box!.x + 120, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Tool auto-switched to selection, so we can click the arrow to delete
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
  await page.mouse.click(box!.x + 30, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await page.mouse.click(box!.x + 120, y);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Tool auto-switched to selection

  // Move mouse away, then hover the arrow hit area
  await page.mouse.move(0, 0);
  const hitArea = page.getByTestId("arrow-hit-area");
  const hitBox = await hitArea.boundingBox();
  expect(hitBox).not.toBeNull();
  const hoverX = hitBox!.x + hitBox!.width / 2;
  const hoverY = hitBox!.y + hitBox!.height / 2;
  await page.mouse.move(hoverX, hoverY, { steps: 5 });

  // X icon circle should appear in the interaction layer
  const interactionLayer = page.locator('[data-testid="arrow-interaction-layer"]');
  await expect(interactionLayer.locator("circle")).toHaveCount(1, { timeout: 2000 });

  // Click the hit area to delete
  await page.mouse.click(hoverX, hoverY);
  await expect(page.getByTestId("arrow-line")).toHaveCount(0, { timeout: 2000 });
});

test("arrow key navigation works after confirming anchor", async ({ page }) => {
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();

  // Click first word to select it
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Press Enter to confirm anchor — selection should be preserved
  await page.keyboard.press("Enter");
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Navigate to a different word using arrow keys
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Preview arrow should appear since we're in anchor-confirmed phase with a new selection
  await expect(page.getByTestId("preview-arrow")).toHaveCount(1, { timeout: 2000 });

  // Press Enter to confirm target and create arrow
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });
});

test("selection is preserved when activating arrow tool, allowing arrow key navigation", async ({ page }) => {
  // This test starts fresh: lock, select a word, then activate arrow tool
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();

  // Switch back to selection tool first
  await page.keyboard.press("s");
  // Wait for arrow-mode class to be removed (tool switch reflected in DOM)
  await expect(page.locator(".simple-editor-wrapper.arrow-mode")).toHaveCount(0, { timeout: 2000 });

  // Click a word to select it
  const freshBox = await firstParagraph.boundingBox();
  await page.mouse.click(freshBox!.x + 30, freshBox!.y + freshBox!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Press 'a' to activate arrow tool — selection should be preserved
  await page.keyboard.press("a");
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Navigate with arrow keys — should work since selection is preserved
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Confirm anchor
  await page.keyboard.press("Enter");

  // Navigate to target
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("preview-arrow")).toHaveCount(1, { timeout: 2000 });

  // Confirm target
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });
});

test("arrow tool button shows depressed state when active", async ({ page }) => {
  const arrowBtn = page.getByTestId("arrowToolButton");
  await expect(arrowBtn).toHaveClass(/bg-accent/, { timeout: 2000 });
});
