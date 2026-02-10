import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Wait for the editor to be fully loaded
  await expect(page.locator(".simple-editor p").first()).toBeVisible();
  // Lock the editor
  await page.getByTestId("lockButton").click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
});

test("clicking a word in locked mode shows word-selection decoration", async ({ page }) => {
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

test("clicking whitespace clears word-selection", async ({ page }) => {
  // First click a word
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Click on the editor wrapper area below all content to trigger non-word click
  const wrapper = page.locator(".simple-editor-wrapper").first();
  const wrapperBox = await wrapper.boundingBox();
  // Click at the very bottom of the wrapper where there's no text
  await page.mouse.click(wrapperBox!.x + wrapperBox!.width / 2, wrapperBox!.y + wrapperBox!.height - 2);

  await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });
});

test("arrow keys navigate between words", async ({ page }) => {
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

test("unlocking clears word selection", async ({ page }) => {
  // Click a word while locked
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Unlock
  await page.getByTestId("lockButton").click();
  await expect(page.getByTestId("editorToolbar")).toBeVisible();

  // Word selection should be gone
  await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });
});
