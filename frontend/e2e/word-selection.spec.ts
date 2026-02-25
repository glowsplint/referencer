import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Wait for the editor to be fully loaded
  await expect(page.locator(".simple-editor p").first()).toBeVisible();
  // Editor starts locked — no need to click lockButton
});

test.describe("word selection in locked mode", () => {

test("when a word is clicked in locked mode, then word-selection decoration appears", async ({ page }) => {
  // Click on a specific word in the first paragraph
  const firstParagraph = page.locator(".simple-editor p").first();
  // Get the bounding box and click in the middle of the text
  const box = await firstParagraph.boundingBox();
  expect(box).not.toBeNull();
  // Click near the start of the paragraph text (where a word should be)
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

  // A word-selection span should appear
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
});

test("when Escape is pressed after selecting, then word-selection is cleared", async ({ page }) => {
  // First click a word
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Press Escape to clear word selection (Bible text has no horizontal rules)
  await page.keyboard.press("Escape");

  await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });
});

test("when arrow keys are pressed, then selection navigates between words", async ({ page }) => {
  // Click a word first
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

  const selection = page.locator(".word-selection");
  await expect(selection).toBeVisible({ timeout: 2000 });
  const firstBox = await selection.boundingBox();
  expect(firstBox).not.toBeNull();

  // Press ArrowRight to move to next word
  await page.keyboard.press("ArrowRight");

  await expect(selection).toBeVisible({ timeout: 2000 });
  const nextBox = await selection.boundingBox();
  expect(nextBox).not.toBeNull();

  // The selection position should have changed
  expect(nextBox!.x).not.toBe(firstBox!.x);
});

test("when editor is unlocked, then word selection is cleared", async ({ page }) => {
  // Click a word while locked
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Unlock (editor starts locked, so this unlocks)
  await page.getByTestId("lockButton").click();
  await expect(page.getByTestId("editorToolbar")).toBeVisible();

  // Word selection should be gone
  await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });
});

}); // end word selection describe
