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

async function addAnnotation(
  page: import("@playwright/test").Page,
  text: string
) {
  const input = page.getByPlaceholder("Add annotation...");
  await expect(input).toBeVisible({ timeout: 2000 });
  await input.fill(text);
  await input.press("Enter");
  await expect(page.getByText(text)).toBeVisible({ timeout: 2000 });
}

test.describe("annotation scroll visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Create a layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    // Lock editor
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("annotation hides when highlighted text scrolls out of view", async ({
    page,
  }) => {
    // Create annotation near the top of the editor
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Scroll test note");

    const wrapper = page.locator(".simple-editor-wrapper").first();

    // Scroll the editor wrapper down so the highlighted text goes out of view
    await wrapper.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for scroll event to trigger recomputation
    await page.waitForTimeout(200);

    // Annotation should disappear since highlighted text is no longer visible
    await expect(page.getByText("Scroll test note")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("annotation reappears when scrolled back into view", async ({
    page,
  }) => {
    // Create annotation near the top of the editor
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Reappear note");

    const wrapper = page.locator(".simple-editor-wrapper").first();

    // Scroll down
    await wrapper.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(200);

    await expect(page.getByText("Reappear note")).toHaveCount(0, {
      timeout: 2000,
    });

    // Scroll back to top
    await wrapper.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(200);

    // Annotation should reappear
    await expect(page.getByText("Reappear note")).toBeVisible({
      timeout: 2000,
    });
  });
});
