import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
  // Hide default layers so their arrows/highlights don't interfere with tests
  for (let i = 0; i < 3; i++) {
    await page.getByTestId(`layerVisibility-${i}`).click();
  }
});

test.describe("layer management", () => {
  test("when management pane loads, then Layers and Passages headings are shown", async ({
    page,
  }) => {
    await expect(page.getByText("Layers")).toBeVisible();
    await expect(page.getByText("Passages")).toBeVisible();
  });

  test("when add layer button is clicked, then Layer 1 is created after default layers", async ({
    page,
  }) => {
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");
  });

  test("when multiple layers are added, then names are incremented", async ({ page }) => {
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();

    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");
    await expect(page.getByTestId("layerName-4")).toHaveText("Layer 2");
    await expect(page.getByTestId("layerName-5")).toHaveText("Layer 3");
  });

  test("when a layer is clicked, then it becomes active", async ({ page }) => {
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();

    // Click second added layer (index 4)
    await page.getByTestId("layerName-4").click();
    await expect(page.getByTestId("layerActiveTag-4")).toBeVisible();
  });

  test("when layer name is double-clicked, then edit mode is entered and rename works", async ({
    page,
  }) => {
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("layerName-3").dblclick();

    const input = page.getByTestId("layerNameInput-3");
    await expect(input).toBeVisible();

    await input.fill("Highlights");
    await input.press("Enter");

    await expect(page.getByTestId("layerName-3")).toHaveText("Highlights");
  });

  test("when layer swatch is clicked, then color picker opens", async ({ page }) => {
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("layerSwatch-3").click();
    await expect(page.getByTestId("colorPicker-3")).toBeVisible();
  });

  test("when a color is selected, then picker closes", async ({ page }) => {
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("layerSwatch-3").click();
    await expect(page.getByTestId("colorPicker-3")).toBeVisible();

    // Click the first color option
    await page.getByTestId("colorPicker-3").locator("button").first().click();
    await expect(page.getByTestId("colorPicker-3")).not.toBeVisible();
  });

  test("when layer visibility is toggled, then title changes", async ({ page }) => {
    await page.getByTestId("addLayerButton").click();

    const toggle = page.getByTestId("layerVisibility-3");
    await expect(toggle).toHaveAttribute("title", "Hide layer");

    await toggle.click();
    await expect(toggle).toHaveAttribute("title", "Show layer");
  });
}); // end layer management describe
