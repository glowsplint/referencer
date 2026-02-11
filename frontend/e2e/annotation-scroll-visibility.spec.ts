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

/** Check whether the annotation card is visually outside the panel's bounds */
async function isCardOutsidePanel(
  page: import("@playwright/test").Page,
  text: string
) {
  const cardBox = await page.getByText(text).boundingBox();
  const panelBox = await page.getByTestId("annotation-panel").boundingBox();
  if (!cardBox || !panelBox) return true;
  return (
    cardBox.y + cardBox.height <= panelBox.y ||
    cardBox.y >= panelBox.y + panelBox.height
  );
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

  test("annotation scrolls out of view when highlighted text scrolls out", async ({
    page,
  }) => {
    // Create annotation near the top of the editor
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Scroll test note");

    // Verify card starts inside the panel
    expect(await isCardOutsidePanel(page, "Scroll test note")).toBe(false);

    const wrapper = page.locator(".simple-editor-wrapper").first();

    // Scroll the editor wrapper down so the highlighted text goes out of view
    await wrapper.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });

    // Wait for scroll event to trigger recomputation
    await page.waitForTimeout(200);

    // Annotation card should be outside the panel's visible area
    expect(await isCardOutsidePanel(page, "Scroll test note")).toBe(true);
  });

  test("annotation scrolls back into view when text returns", async ({
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

    expect(await isCardOutsidePanel(page, "Reappear note")).toBe(true);

    // Scroll back to top
    await wrapper.evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.waitForTimeout(200);

    // Annotation should be back inside the panel
    expect(await isCardOutsidePanel(page, "Reappear note")).toBe(false);
  });
});
