import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
  // Editor starts locked — Cmd+Z goes to workspace undo
});

test("undo reverts adding a layer", async ({ page }) => {
  // Add a layer (appended after 4 default layers, at index 4)
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-4")).toHaveText("Layer 1");

  // Undo
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-4")).not.toBeVisible();
});

test("redo restores an undone layer", async ({ page }) => {
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-4")).toHaveText("Layer 1");

  // Undo then redo
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-4")).not.toBeVisible();

  await page.keyboard.press("Meta+Shift+z");
  await expect(page.getByTestId("layerName-4")).toBeVisible();
});

test("undo reverts renaming a layer", async ({ page }) => {
  // Add a layer
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-4")).toHaveText("Layer 1");

  // Rename the layer
  await page.getByTestId("layerName-4").dblclick();
  const input = page.getByTestId("layerNameInput-4");
  await input.fill("Renamed");
  await input.press("Enter");
  await expect(page.getByTestId("layerName-4")).toHaveText("Renamed");

  // Undo the rename
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-4")).toHaveText("Layer 1");
});

test("multiple undo/redo with layers", async ({ page }) => {
  // Add two layers
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-4")).toHaveText("Layer 1");
  await expect(page.getByTestId("layerName-5")).toHaveText("Layer 2");

  // Undo both
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-5")).not.toBeVisible();
  await expect(page.getByTestId("layerName-4")).toHaveText("Layer 1");

  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-4")).not.toBeVisible();

  // Redo both
  await page.keyboard.press("Meta+Shift+z");
  await expect(page.getByTestId("layerName-4")).toBeVisible();

  await page.keyboard.press("Meta+Shift+z");
  await expect(page.getByTestId("layerName-5")).toBeVisible();
});
