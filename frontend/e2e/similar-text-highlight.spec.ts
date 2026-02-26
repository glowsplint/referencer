import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".simple-editor p").first()).toBeVisible();
  // Editor starts locked — no need to click lockButton
});

test.describe("similar text highlighting", () => {
  test("when a word is clicked, then similar-text-highlight decorations appear for matching words", async ({
    page,
  }) => {
    // Click on a word in the first editor
    const firstParagraph = page.locator(".simple-editor p").first();
    const box = await firstParagraph.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

    // Primary word-selection should appear
    await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

    // If the selected word appears elsewhere, similar-text-highlight decorations should exist
    const selectedText = await page.locator(".word-selection").textContent();

    // Count how many times this word appears across all editors
    const allText = await page.locator(".simple-editor").allTextContents();
    const fullText = allText.join(" ");
    let count = 0;
    let idx = 0;
    while ((idx = fullText.indexOf(selectedText!, idx)) !== -1) {
      count++;
      idx += selectedText!.length;
    }

    if (count > 1) {
      // There should be similar-text-highlight decorations (count - 1 for the primary)
      await expect(page.locator(".similar-text-highlight").first()).toBeVisible({ timeout: 2000 });
    }
  });

  test("when a word is selected, then primary word has word-selection class without similar-text-highlight", async ({
    page,
  }) => {
    const firstParagraph = page.locator(".simple-editor p").first();
    const box = await firstParagraph.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

    await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

    // The primary selection element should not also have the similar-text-highlight class
    const primaryElement = page.locator(".word-selection");
    await expect(primaryElement).not.toHaveClass(/similar-text-highlight/);
  });

  test("when editor is unlocked, then similar-text-highlight decorations are cleared", async ({
    page,
  }) => {
    // Click a word to trigger highlights
    const firstParagraph = page.locator(".simple-editor p").first();
    const box = await firstParagraph.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);

    await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

    // Unlock
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toBeVisible();

    // Similar text highlights should be gone
    await expect(page.locator(".similar-text-highlight")).toHaveCount(0, { timeout: 2000 });
  });
}); // end similar text highlighting describe
