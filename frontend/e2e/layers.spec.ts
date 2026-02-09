import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Open management pane
  await page.getByTestId("menuButton").click();
  await expect(page.getByTestId("managementPane")).toBeVisible();
});

test("shows Layers and Passages headings", async ({ page }) => {
  await expect(page.getByText("Layers")).toBeVisible();
  await expect(page.getByText("Passages")).toBeVisible();
});

test("add layer creates Layer 1", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");
});

test("adding multiple layers increments names", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("addLayerButton").click();

  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");
  await expect(page.getByTestId("layerName-1")).toHaveText("Layer 2");
  await expect(page.getByTestId("layerName-2")).toHaveText("Layer 3");
});

test("clicking a layer makes it active", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("addLayerButton").click();

  // Click second layer
  await page.getByTestId("layerName-1").click();
  await expect(page.getByTestId("layerActiveTag-1")).toBeVisible();
});

test("double-click layer name enters edit mode and rename", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("layerName-0").dblclick();

  const input = page.getByTestId("layerNameInput-0");
  await expect(input).toBeVisible();

  await input.fill("Highlights");
  await input.press("Enter");

  await expect(page.getByTestId("layerName-0")).toHaveText("Highlights");
});

test("layer swatch opens color picker", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("layerSwatch-0").click();
  await expect(page.getByTestId("colorPicker-0")).toBeVisible();
});

test("selecting a color closes picker", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("layerSwatch-0").click();
  await expect(page.getByTestId("colorPicker-0")).toBeVisible();

  // Click the first color option
  await page.getByTestId("colorPicker-0").locator("button").first().click();
  await expect(page.getByTestId("colorPicker-0")).not.toBeVisible();
});

test("layer visibility toggle changes title", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();

  const toggle = page.getByTestId("layerVisibility-0");
  await expect(toggle).toHaveAttribute("title", "Hide layer");

  await toggle.click();
  await expect(toggle).toHaveAttribute("title", "Show layer");
});
