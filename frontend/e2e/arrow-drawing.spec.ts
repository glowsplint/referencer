import { test, expect } from "@playwright/test";

let initialArrowCount = 0;

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".simple-editor p").first()).toBeVisible();

  // Hide default layers so their arrows/highlights don't interfere with tests
  for (let i = 0; i < 3; i++) {
    await page.getByTestId(`layerVisibility-${i}`).click();
  }

  // Editor starts locked with 3 default layers (some have arrows). Add a fresh layer.
  await page.getByTestId("addLayerButton").click();

  // Record initial arrow count from default layers
  initialArrowCount = await page.getByTestId("arrow-line").count();

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

  // One additional arrow should appear
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });
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

  // Arrow count should not change
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount, { timeout: 2000 });
});

test("click on arrow line selects it and activates arrow tool", async ({ page }) => {
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
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });

  // Switch to selection tool so arrow hit areas accept pointer events
  await page.keyboard.press("s");

  // Click the arrow hit area to select it — use .last() since our new arrow is the most recent
  await page.getByTestId("arrow-hit-area").last().click({ force: true });
  await expect(page.getByTestId("arrow-selection-ring")).toHaveCount(1, { timeout: 2000 });

  // Arrow tool should be active (selecting an arrow activates arrow tool)
  await expect(page.getByTestId("arrowToolButton")).toHaveClass(/bg-accent/, { timeout: 2000 });
});

test("clicking selected arrow X icon deletes it, hover alone does not show X", async ({ page }) => {
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
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });

  // Switch to selection tool so arrow hit areas accept pointer events
  await page.keyboard.press("s");

  // Deselect by clicking empty area
  await page.mouse.click(0, 0);
  const interactionLayer = page.locator('[data-testid="arrow-interaction-layer"]');

  // Hover the arrow hit area — X icon should NOT appear (hover alone), but hover ring should
  const hitArea = page.getByTestId("arrow-hit-area").last();
  await hitArea.evaluate((el) => {
    el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }));
  });
  await expect(interactionLayer.locator("circle")).toHaveCount(0, { timeout: 2000 });
  await expect(page.getByTestId("arrow-hover-ring")).toHaveCount(1, { timeout: 2000 });

  // Click to select the arrow — X icon should appear, hover ring should disappear
  await hitArea.click({ force: true });
  await expect(interactionLayer.locator("circle")).toHaveCount(1, { timeout: 2000 });
  await expect(page.getByTestId("arrow-hover-ring")).toHaveCount(0, { timeout: 2000 });

  // Click the X icon to delete
  const deleteIcon = page.getByTestId("arrow-delete-icon");
  await deleteIcon.click({ force: true });
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount, { timeout: 2000 });
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
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });
});

test("selection is preserved when activating arrow tool, allowing arrow key navigation", async ({
  page,
}) => {
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
  await expect(page.getByTestId("arrow-line")).toHaveCount(initialArrowCount + 1, {
    timeout: 2000,
  });
});

test("arrow tool button shows depressed state when active", async ({ page }) => {
  const arrowBtn = page.getByTestId("arrowToolButton");
  await expect(arrowBtn).toHaveClass(/bg-accent/, { timeout: 2000 });
});
