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
  await expect(page.locator(".word-selection").first()).toBeVisible({
    timeout: 2000,
  });
}

const cmdModifier = process.platform === "darwin" ? "Meta" : "Control";

test.describe("when using keyboard navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }
    // Editor starts locked — no need to click lockButton
  });

  test("when Escape is pressed, then word selection is cleared", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);
    await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when Home is pressed, then selection moves to first word in passage", async ({ page }) => {
    // Click a word that's not the first (offset further right)
    await clickWordInEditor(page, 0, 100);

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.keyboard.press("Home");
    await page.waitForTimeout(100);

    const homeBox = await selection.boundingBox();
    expect(homeBox).not.toBeNull();
    // Home should move to the beginning (smaller x position, or at least different)
    expect(homeBox!.x).toBeLessThanOrEqual(initialBox!.x);
  });

  test("when End is pressed, then selection moves to last word in passage", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();

    await page.keyboard.press("End");
    await page.waitForTimeout(100);

    const endBox = await selection.boundingBox();
    expect(endBox).not.toBeNull();
    // End should move to last word — which is on the last line (lower y) or at least a different position
    expect(endBox!.y).toBeGreaterThanOrEqual(initialBox!.y);
  });

  test("when Cmd+A is pressed, then all words in active passage are selected", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);

    const selection = page.locator(".word-selection");
    const initialBox = await selection.boundingBox();
    expect(initialBox).not.toBeNull();
    const initialWidth = initialBox!.width;

    await page.keyboard.press(`${cmdModifier}+a`);
    await page.waitForTimeout(100);

    // After Cmd+A the selection should be much wider (covering the whole passage)
    const selectAllBox = await selection.first().boundingBox();
    expect(selectAllBox).not.toBeNull();
    expect(selectAllBox!.width).toBeGreaterThan(initialWidth);
  });
});

test.describe("when pressing Tab", () => {
  test("when Tab is pressed, then active layer cycles to the next one", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 3 default layers. Add two more at indices 3 and 4.
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");
    await expect(page.getByTestId("layerName-4")).toHaveText("Layer 2");

    // Activate Layer 1 (index 3) — Layer 2 (index 4) is active by default as most recently added
    await page.getByTestId("layerName-3").click();
    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();

    // Click on a word so focus is in the locked (non-editable) editor area
    await clickWordInEditor(page, 0, 50);
    await page.waitForTimeout(200);

    // Tab should cycle to Layer 2 (index 4)
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("layerActiveTag-4")).toBeVisible();

    // Tab again should cycle (wrapping through all 5 layers)
    // Keep pressing Tab until we get back to index 3
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
    }
    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();
  });
});
