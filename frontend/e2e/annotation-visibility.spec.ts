import { test, expect } from "@playwright/test";

async function clickWordInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  xOffset = 30,
) {
  const p = page.locator(".simple-editor-wrapper").nth(editorIndex).locator("p").first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + xOffset, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
}

async function addAnnotation(page: import("@playwright/test").Page, text: string) {
  await page.keyboard.press("Enter");
  const input = page.getByPlaceholder("Add annotation...");
  await expect(input).toBeVisible({ timeout: 2000 });
  await input.fill(text);
  await input.press("Enter");
  await expect(page.getByText(text)).toBeVisible({ timeout: 2000 });
}

test.describe("when toggling layer visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Editor starts locked with 3 default layers.
    // Add two fresh layers for the test at indices 3 and 4.
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");
    await expect(page.getByTestId("layerName-4")).toHaveText("Layer 2");

    // Activate Layer 1 (index 3)
    await page.getByTestId("layerName-3").click();
    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when layer is hidden, then its annotations disappear", async ({ page }) => {
    // Create annotation on Layer 1 (index 3)
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Layer 1 note");

    // Hide Layer 1 (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // Annotation should disappear
    await expect(page.getByText("Layer 1 note")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when layer is shown again, then its annotations are restored", async ({ page }) => {
    // Create annotation on Layer 1 (index 3)
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Restored note");

    // Hide then show Layer 1 (index 3)
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByText("Restored note")).toHaveCount(0, {
      timeout: 2000,
    });

    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByText("Restored note")).toBeVisible({
      timeout: 2000,
    });
  });

  test("when one layer is hidden, then annotations on other layers remain visible", async ({
    page,
  }) => {
    // Create annotation on Layer 1 (index 3)
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "L1 annotation");

    // Dismiss annotation focus and clear selection
    await page.keyboard.press("Escape");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.waitForTimeout(200);

    // Switch to Layer 2 (index 4) by clicking in management pane
    await page.getByTestId("layerName-4").click();
    await expect(page.getByTestId("layerActiveTag-4")).toBeVisible();

    // Create annotation on Layer 2 — click on a lower line to avoid annotation panel
    const p = page.locator(".simple-editor-wrapper").nth(0).locator("p").first();
    const pBox = await p.boundingBox();
    await page.mouse.click(pBox!.x + 30, pBox!.y + pBox!.height * 0.8);
    await expect(page.locator(".word-selection")).toBeVisible({ timeout: 3000 });
    await addAnnotation(page, "L2 annotation");

    // Both visible
    await expect(page.getByText("L1 annotation")).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByText("L2 annotation")).toBeVisible({
      timeout: 2000,
    });

    // Hide Layer 1 (index 3) — only L1 annotation disappears
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByText("L1 annotation")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(page.getByText("L2 annotation")).toBeVisible({
      timeout: 2000,
    });

    // Show Layer 1, hide Layer 2
    await page.getByTestId("layerVisibility-3").click();
    await page.getByTestId("layerVisibility-4").click();
    await expect(page.getByText("L1 annotation")).toBeVisible({
      timeout: 2000,
    });
    await expect(page.getByText("L2 annotation")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when all layers are hidden, then annotation panel disappears", async ({ page }) => {
    // Create annotation on Layer 1 (index 3)
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Only note");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Hide ALL layers (3 default + 2 test layers)
    for (let i = 0; i <= 4; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Panel should disappear
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show test Layer 1 (index 3) again — panel reappears
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });
  });
});

test.describe("when toggling passage visibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Editor starts locked with 2 passages and 3 default layers.
    // Add a fresh layer for tests.
    await page.getByTestId("addLayerButton").click();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when passage is hidden, then its annotations disappear", async ({ page }) => {
    // Create annotation in passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Passage 1 note");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Hide passage 1
    await page.getByTestId("sectionVisibility-0").click();

    // Annotation should disappear since its passage is hidden
    await expect(page.getByText("Passage 1 note")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when passage is shown again, then its annotations are restored", async ({ page }) => {
    // Create annotation in passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Restored passage note");

    // Hide then show passage 1
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByText("Restored passage note")).toHaveCount(0, {
      timeout: 2000,
    });

    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByText("Restored passage note")).toBeVisible({
      timeout: 2000,
    });
  });

  test("when one passage is hidden, then annotations in other passages remain visible", async ({
    page,
  }) => {
    // Create annotation in passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "P1 note");

    // Create annotation in passage 2
    await clickWordInEditor(page, 1, 30);
    await addAnnotation(page, "P2 note");

    // Both visible
    await expect(page.getByText("P1 note")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("P2 note")).toBeVisible({ timeout: 2000 });

    // Hide passage 1 — only P1 annotation disappears
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByText("P1 note")).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByText("P2 note")).toBeVisible({ timeout: 2000 });

    // Show passage 1, hide passage 2
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByText("P1 note")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("P2 note")).toHaveCount(0, { timeout: 2000 });
  });

  test("when all passages are hidden, then annotation panel disappears", async ({ page }) => {
    // Create annotation in passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Only passage note");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Hide both passages
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();

    // Panel should disappear
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show passage 1 — panel reappears
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });
  });
});

test.describe("when combining layer and passage visibility toggles", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Editor starts locked with 2 passages and 3 default layers.
    // Add two fresh layers at indices 3 and 4.
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();

    // Activate Layer 1 (index 3)
    await page.getByTestId("layerName-3").click();
    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when layer is hidden then passage is hidden and restored in reverse, then annotations reappear correctly", async ({
    page,
  }) => {
    // Create annotation on Layer 1 (index 3) in passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Combined note");

    // Hide layer (index 3)
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByText("Combined note")).toHaveCount(0, {
      timeout: 2000,
    });

    // Also hide passage
    await page.getByTestId("sectionVisibility-0").click();

    // Show layer (passage still hidden) — annotation should NOT appear
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByText("Combined note")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show passage — now annotation should appear
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByText("Combined note")).toBeVisible({
      timeout: 2000,
    });
  });

  test("when layers and passages are toggled independently, then annotations respect both visibility states", async ({
    page,
  }) => {
    // Layer 1 (index 3), Passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "L1P1");

    // Layer 1 (index 3), Passage 2
    await clickWordInEditor(page, 1, 30);
    await addAnnotation(page, "L1P2");

    // Dismiss annotation focus and clear selection
    await page.keyboard.press("Escape");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.waitForTimeout(200);

    // Switch to Layer 2 (index 4) by clicking in management pane
    await page.getByTestId("layerName-4").click();
    await expect(page.getByTestId("layerActiveTag-4")).toBeVisible();

    // Layer 2 (index 4), Passage 1 — click on a lower line to avoid annotation panel
    const p = page.locator(".simple-editor-wrapper").nth(0).locator("p").first();
    const pBox = await p.boundingBox();
    await page.mouse.click(pBox!.x + 30, pBox!.y + pBox!.height * 0.8);
    await expect(page.locator(".word-selection")).toBeVisible({ timeout: 3000 });
    await addAnnotation(page, "L2P1");

    // All 3 visible
    await expect(page.getByText("L1P1")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("L1P2")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("L2P1")).toBeVisible({ timeout: 2000 });

    // Hide Layer 1 (index 3) — L1P1 and L1P2 disappear
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByText("L1P1")).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByText("L1P2")).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByText("L2P1")).toBeVisible({ timeout: 2000 });

    // Show Layer 1, hide Passage 1 — L1P1 and L2P1 disappear
    await page.getByTestId("layerVisibility-3").click();
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByText("L1P1")).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByText("L1P2")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText("L2P1")).toHaveCount(0, { timeout: 2000 });
  });
});
