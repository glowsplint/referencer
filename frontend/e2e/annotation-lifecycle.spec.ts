import { test, expect } from "@playwright/test";

async function clickWordInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  xOffset = 30
) {
  const p = page
    .locator(".simple-editor-wrapper")
    .nth(editorIndex)
    .locator("p")
    .first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + xOffset, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
}

test.describe("annotation lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Create a layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    // Lock the editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("clicking a word creates annotation card in panel", async ({
    page,
  }) => {
    // No annotation panel initially
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0);

    // Click a word to create a highlight
    await clickWordInEditor(page, 0);

    // Annotation panel should now appear with one card
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

    // Don't type anything, just press Escape to blur
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.press("Escape");

    // Empty annotation triggers cleanup on blur — panel disappears
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("empty annotation is removed when textarea blurs", async ({ page }) => {
    await clickWordInEditor(page, 0);

    // Annotation auto-focuses. Don't type anything, just click elsewhere
    await expect(page.getByPlaceholder("Add annotation...")).toBeVisible({
      timeout: 2000,
    });

    // Click on the horizontal rule to blur the annotation
    const hr = page
      .locator('.simple-editor [data-type="horizontalRule"]')
      .first();
    await hr.click();

    // Empty annotation should be removed, panel disappears
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("clicking same word again removes its highlight", async ({ page }) => {
    await clickWordInEditor(page, 0);

    // Save an annotation first
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill("To be removed");
    await input.press("Enter");

    await expect(page.getByText("To be removed")).toBeVisible({
      timeout: 2000,
    });

    // Click the exact same word again to toggle highlight off
    await clickWordInEditor(page, 0);

    // The annotation should be gone
    await expect(page.getByText("To be removed")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("multiple annotations from different words show in panel", async ({
    page,
  }) => {
    // Click first word, add annotation
    await clickWordInEditor(page, 0, 30);
    const input1 = page.getByPlaceholder("Add annotation...");
    await expect(input1).toBeVisible({ timeout: 2000 });
    await input1.fill("First note");
    await input1.press("Enter");

    // Click second word (different position), add annotation
    await clickWordInEditor(page, 0, 100);
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
    const input = page.getByPlaceholder("Add annotation...");
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill("Persisted");
    await input.press("Enter");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Unlock editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toBeVisible();

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
