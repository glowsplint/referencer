import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
});

test("undo reverts adding a layer", async ({ page }) => {
  // Lock the editor so Cmd+Z goes to workspace undo
  await page.getByTestId("lockButton").click();

  // Add a layer
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

  // Undo
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-0")).not.toBeVisible();
});

test("redo restores an undone layer", async ({ page }) => {
  await page.getByTestId("lockButton").click();

  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

  // Undo then redo
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-0")).not.toBeVisible();

  await page.keyboard.press("Meta+Shift+z");
  await expect(page.getByTestId("layerName-0")).toBeVisible();
});

test("undo reverts renaming a layer", async ({ page }) => {
  await page.getByTestId("lockButton").click();

  // Add a layer
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

  // Rename the layer
  await page.getByTestId("layerName-0").dblclick();
  const input = page.getByTestId("layerNameInput-0");
  await input.fill("Renamed");
  await input.press("Enter");
  await expect(page.getByTestId("layerName-0")).toHaveText("Renamed");

  // Undo the rename
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");
});

test("multiple undo/redo with layers", async ({ page }) => {
  await page.getByTestId("lockButton").click();

  // Add two layers
  await page.getByTestId("addLayerButton").click();
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");
  await expect(page.getByTestId("layerName-1")).toHaveText("Layer 2");

  // Undo both
  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-1")).not.toBeVisible();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

  await page.keyboard.press("Meta+z");
  await expect(page.getByTestId("layerName-0")).not.toBeVisible();

  // Redo both
  await page.keyboard.press("Meta+Shift+z");
  await expect(page.getByTestId("layerName-0")).toBeVisible();

  await page.keyboard.press("Meta+Shift+z");
  await expect(page.getByTestId("layerName-1")).toBeVisible();
});
