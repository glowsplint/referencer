import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
  // Editor starts locked — Cmd+Z goes to workspace undo
});

test.describe("undo/redo", () => {
  test("when a layer is added and Cmd+Z is pressed, then the layer is removed", async ({
    page,
  }) => {
    // Add a layer (appended after 3 default layers, at index 3)
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");

    // Undo
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("layerName-3")).not.toBeVisible();
  });

  test("when Cmd+Shift+Z is pressed after undo, then layer is restored", async ({ page }) => {
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");

    // Undo then redo
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("layerName-3")).not.toBeVisible();

    await page.keyboard.press("Meta+Shift+z");
    await expect(page.getByTestId("layerName-3")).toBeVisible();
  });

  test("when a layer is renamed and Cmd+Z is pressed, then rename is reverted", async ({
    page,
  }) => {
    // Add a layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");

    // Wait for Yjs UndoManager captureTimeout (500ms) so the add and rename
    // are recorded as separate undo steps
    await page.waitForTimeout(600);

    // Rename the layer
    await page.getByTestId("layerName-3").dblclick();
    const input = page.getByTestId("layerNameInput-3");
    await input.fill("Renamed");
    await input.press("Enter");
    await expect(page.getByTestId("layerName-3")).toHaveText("Renamed");

    // Undo the rename — only the rename should revert, not the layer addition
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");
  });

  test("when multiple layers are added, then multiple undo/redo steps work correctly", async ({
    page,
  }) => {
    // Add first layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");

    // Wait for Yjs UndoManager captureTimeout (500ms) so each layer addition
    // is recorded as a separate undo step
    await page.waitForTimeout(600);

    // Add second layer
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-4")).toHaveText("Layer 2");

    // Undo second layer
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("layerName-4")).not.toBeVisible();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");

    // Undo first layer
    await page.keyboard.press("Meta+z");
    await expect(page.getByTestId("layerName-3")).not.toBeVisible();

    // Redo first layer
    await page.keyboard.press("Meta+Shift+z");
    await expect(page.getByTestId("layerName-3")).toBeVisible();

    // Redo second layer
    await page.keyboard.press("Meta+Shift+z");
    await expect(page.getByTestId("layerName-4")).toBeVisible();
  });
}); // end undo/redo describe
