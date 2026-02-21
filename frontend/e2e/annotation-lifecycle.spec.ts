import { test, expect } from "@playwright/test";

async function clickWordInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  xOffset = 30,
  paragraphIndex = 0
) {
  const p = page
    .locator(".simple-editor-wrapper")
    .nth(editorIndex)
    .locator("p")
    .nth(paragraphIndex);
  const box = await p.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + xOffset, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 3000 });
}

test.describe("annotation lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Editor starts locked with default layers — ready for annotations.
    // Add a fresh layer so tests don't collide with default layer annotations.
    await page.getByTestId("addLayerButton").click();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("clicking a word and pressing Enter creates annotation card in panel", async ({
    page,
  }) => {
    // Click a word to select it, then press Enter to confirm
    await clickWordInEditor(page, 0);
    await page.keyboard.press("Enter");

    // Annotation panel should show with new annotation input
    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByPlaceholder("Add annotation...")).toBeVisible({
      timeout: 2000,
    });
  });

  test("typing annotation text and pressing Enter saves it", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0);
    await page.keyboard.press("Enter");

    // Annotation input auto-focuses
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });

    await input.fill("Test annotation");
    await input.press("Enter");

    // After saving, the annotation text should appear in view mode
    await expect(page.getByText("Test annotation")).toBeVisible({
      timeout: 2000,
    });
  });

  test("clicking annotation card enters edit mode", async ({ page }) => {
    await clickWordInEditor(page, 0);
    await page.keyboard.press("Enter");

    // Type and save an annotation
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill("My note");
    await input.press("Enter");

    // Click the saved annotation text to enter edit mode
    await page.getByText("My note").click();

    // Should be editable now (textarea visible with the text)
    const textarea = page.locator(
      '[data-testid="annotation-panel"] textarea'
    );
    await expect(textarea).toBeVisible({ timeout: 2000 });
    await expect(textarea).toHaveValue("My note");
  });

  test("pressing Escape blurs annotation textarea without saving empty", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0);
    await page.keyboard.press("Enter");

    // Don't type anything, just press Escape to blur
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.press("Escape");

    // Empty annotation triggers cleanup on blur — input disappears
    await expect(page.getByPlaceholder("Add annotation...")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("empty annotation is removed when textarea blurs", async ({ page }) => {
    await clickWordInEditor(page, 0);
    await page.keyboard.press("Enter");

    // Annotation auto-focuses. Don't type anything, just click elsewhere
    await expect(page.getByPlaceholder("Add annotation...")).toBeVisible({
      timeout: 2000,
    });

    // Click on the passage header to blur the annotation
    await page.getByTestId("passageHeader-0").click();

    // Empty annotation should be removed — input disappears
    await expect(page.getByPlaceholder("Add annotation...")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("clicking same word again removes its highlight", async ({ page }) => {
    // Use a word further from the edge that won't shift when the annotation panel appears
    await clickWordInEditor(page, 0, 10);
    // Capture the selected word text so we can find it again after layout shift
    const selectedText = await page.locator(".word-selection").textContent();
    expect(selectedText).toBeTruthy();

    await page.keyboard.press("Enter");

    // Save an annotation first
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill("To be removed");
    await input.press("Enter");

    await expect(page.getByText("To be removed")).toBeVisible({
      timeout: 2000,
    });

    // Clear focus from annotation panel so keyboard events go to workspace
    await page.getByTestId("passageHeader-0").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });

    // Click the same word again by computing its exact bounding rect.
    // getByText matches the whole paragraph, not the individual word,
    // so we use Range API to find the precise word position.
    const wordRect = await page.evaluate((word) => {
      const editors = document.querySelectorAll(".simple-editor-wrapper");
      const editor = editors[0];
      if (!editor) return null;
      const paragraphs = editor.querySelectorAll("p");
      const p = paragraphs[0];
      if (!p) return null;

      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        const idx = node.textContent?.indexOf(word) ?? -1;
        if (idx >= 0) {
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + word.length);
          const rect = range.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }
      }
      return null;
    }, selectedText!);
    expect(wordRect).not.toBeNull();

    await page.mouse.click(
      wordRect!.x + wordRect!.width / 2,
      wordRect!.y + wordRect!.height / 2
    );
    await expect(page.locator(".word-selection")).toBeVisible({
      timeout: 3000,
    });

    await page.keyboard.press("Enter");

    // The annotation should be gone
    await expect(page.getByText("To be removed")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("multiple annotations from different words show in panel", async ({
    page,
  }) => {
    // Click first word, confirm and add annotation
    await clickWordInEditor(page, 0, 30);
    await page.keyboard.press("Enter");
    const input1 = page.getByPlaceholder("Add annotation...");
    await expect(input1).toBeVisible({ timeout: 2000 });
    await input1.fill("First note");
    await input1.press("Enter");

    // Move focus away from annotation input, then Escape to clear word selection
    await page.getByTestId("passageHeader-0").click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    // Click a word in the second editor (avoids annotation panel overlap)
    await clickWordInEditor(page, 1, 30);
    await page.keyboard.press("Enter");
    const input2 = page.getByPlaceholder("Add annotation...");
    await expect(input2).toBeVisible({ timeout: 2000 });
    await input2.fill("Second note");
    await input2.press("Enter");

    // Both annotations should be visible
    await expect(page.getByText("First note")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("Second note")).toBeVisible({ timeout: 2000 });
  });

  test("annotation panel not visible when editor is unlocked", async ({
    page,
  }) => {
    // Create annotation
    await clickWordInEditor(page, 0);
    await page.keyboard.press("Enter");
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill("Persisted");
    await input.press("Enter");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Unlock editor (starts locked, so this unlocks)
    await page.getByTestId("lockButton").click();

    // Annotation panel should disappear
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });

    // Re-lock — annotation panel should reappear with the saved annotation
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByText("Persisted")).toBeVisible({ timeout: 2000 });
  });
});
