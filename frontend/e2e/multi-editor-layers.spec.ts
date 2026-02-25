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

async function drawArrowInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  anchorXOffset = 30,
  targetXOffset = 120,
) {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  // Switch to selection first, then arrow, to ensure a clean entry into arrow
  // mode (clears any lingering flash message from a previous arrow creation).
  await page.keyboard.press("s");
  await page.keyboard.press("a");

  const p = page.locator(".simple-editor-wrapper").nth(editorIndex).locator("p").first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();

  // Click near top of paragraph to avoid annotation panel overlap
  await page.mouse.click(box!.x + anchorXOffset, box!.y + 10);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");

  // Wait for status bar to confirm anchor was accepted
  await expect(page.getByTestId("status-bar")).toContainText("select the target", {
    timeout: 2000,
  });

  // Select and confirm target
  await page.mouse.click(box!.x + targetXOffset, box!.y + 10);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  // Wait for arrow creation to settle
  await page.waitForTimeout(300);
}

async function drawArrowBetweenEditors(
  page: import("@playwright/test").Page,
  sourceEditor: number,
  targetEditor: number,
  anchorXOffset = 30,
  targetXOffset = 30,
) {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press("a");

  const srcP = page.locator(".simple-editor-wrapper").nth(sourceEditor).locator("p").first();
  const srcBox = await srcP.boundingBox();
  expect(srcBox).not.toBeNull();

  // Click near top of paragraph to avoid annotation panel overlap
  await page.mouse.click(srcBox!.x + anchorXOffset, srcBox!.y + 10);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");

  // Wait for status bar to confirm anchor was accepted
  await expect(page.getByTestId("status-bar")).toContainText("select the target", {
    timeout: 2000,
  });

  const tgtP = page.locator(".simple-editor-wrapper").nth(targetEditor).locator("p").first();
  const tgtBox = await tgtP.boundingBox();
  expect(tgtBox).not.toBeNull();

  // Click near top of paragraph to avoid annotation panel overlap
  await page.mouse.click(tgtBox!.x + targetXOffset, tgtBox!.y + 10);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  // Wait for status bar flash confirming arrow was created
  await page.waitForTimeout(300);
}

test.describe("when drawing cross-editor arrows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Add a fresh layer for tests.
    await page.getByTestId("addLayerButton").click();

    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("when arrow is drawn from editor 1 to editor 2, then arrow line appears", async ({ page }) => {
    await drawArrowBetweenEditors(page, 0, 1);

    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByTestId("preview-arrow")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when cross-editor arrow is drawn, then highlights appear as inline decorations", async ({ page }) => {
    await drawArrowBetweenEditors(page, 0, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Both arrow endpoints should be highlighted as inline decorations
    const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
    await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });
  });

  test("when cross-editor arrow is selected and X is clicked, then it is deleted", async ({ page }) => {
    await drawArrowBetweenEditors(page, 0, 1);

    const arrowLine = page.getByTestId("arrow-line");
    await expect(arrowLine).toHaveCount(1, { timeout: 2000 });

    // Switch to selection tool so hit areas accept clicks
    await page.keyboard.press("s");

    // Click the arrow hit area to select it (X icon appears on selection)
    const hitArea = page.getByTestId("arrow-hit-area");
    await hitArea.click({ force: true });

    const interactionLayer = page.locator('[data-testid="arrow-interaction-layer"]');
    await expect(interactionLayer.locator("circle")).toHaveCount(1, { timeout: 2000 });

    // Click X icon to delete
    const deleteIcon = page.getByTestId("arrow-delete-icon");
    await deleteIcon.click({ force: true });
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when layer is hidden, then cross-editor arrow and highlights are removed", async ({ page }) => {
    await drawArrowBetweenEditors(page, 0, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Reopen management pane to toggle visibility
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).toBeVisible();

    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
    await expect(endpointDecorations).toHaveCount(0, { timeout: 2000 });

    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });
  });
});

test.describe("when working with multiple layers across editors", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Add two fresh layers at indices 3 and 4.
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");
    await expect(page.getByTestId("layerName-4")).toHaveText("Layer 2");

    // Make Layer 1 (index 3) active — Layer 2 (index 4) is active by default
    await page.getByTestId("layerName-3").click();
    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();

    // Close management pane for more space when drawing arrows
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("when arrows are drawn on different layers, then they are independent", async ({ page }) => {
    // Draw arrow on Layer 1 (index 3) in E1
    await drawArrowInEditor(page, 0);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Cycle to Layer 2 (index 4)
    await page.keyboard.press("Tab");

    // Open management pane to verify active layer changed
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("layerActiveTag-4")).toBeVisible();
    // Close management pane again for drawing space
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    // Draw arrow on Layer 2 in E2
    await drawArrowInEditor(page, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });
  });

  test("when one layer visibility is toggled, then other layer's arrows are not affected", async ({ page }) => {
    // Draw arrow on Layer 1 in E1
    await drawArrowInEditor(page, 0);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Cycle to Layer 2 and draw arrow in E2
    await page.keyboard.press("Tab");
    await drawArrowInEditor(page, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    // Reopen management pane to toggle visibility
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).toBeVisible();

    // Hide Layer 1 (index 3) — only its arrow should disappear
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show Layer 1, hide Layer 2 (index 4)
    await page.getByTestId("layerVisibility-3").click();
    await page.getByTestId("layerVisibility-4").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show both
    await page.getByTestId("layerVisibility-4").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });
  });

  test("when Tab key is pressed, then active layer cycles", async ({ page }) => {
    // Open management pane so layerActiveTag test IDs are visible
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).toBeVisible();

    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();

    await page.keyboard.press("Tab");
    await expect(page.getByTestId("layerActiveTag-4")).toBeVisible();

    // Tab again — cycles through all 5 layers back to index 3
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
    }
    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();
  });

  test("when highlights are created on different layers, then they coexist across editors", async ({ page }) => {
    // Switch to comments tool for annotation creation
    await page.keyboard.press("c");
    // Click word in E1 → highlight on Layer 1 (index 3)
    await clickWordInEditor(page, 0);

    // Confirm selection and add annotation so highlight persists across layer switch
    await page.keyboard.press("Enter");
    await page.getByPlaceholder("Add annotation...").fill("E1 note");
    await page.getByPlaceholder("Add annotation...").press("Enter");

    // Clear selection by pressing Escape
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    const e1Highlights = page
      .locator(".simple-editor-wrapper")
      .nth(0)
      .locator('span[style*="background-color"]');
    await expect(e1Highlights).toHaveCount(1, { timeout: 2000 });

    // Cycle to Layer 2 (index 4) and click word in E2
    await page.keyboard.press("Tab");
    await clickWordInEditor(page, 1, 60);

    // Confirm selection and add annotation for E2 highlight too
    await page.keyboard.press("Enter");
    await page.getByPlaceholder("Add annotation...").fill("E2 note");
    await page.getByPlaceholder("Add annotation...").press("Enter");

    // Clear selection again
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, { timeout: 2000 });

    const e2Highlights = page
      .locator(".simple-editor-wrapper")
      .nth(1)
      .locator('span[style*="background-color"]');
    await expect(e2Highlights).toHaveCount(1, { timeout: 2000 });
    // E1 highlight should still be visible
    await expect(e1Highlights).toHaveCount(1, { timeout: 2000 });

    // Reopen management pane to toggle visibility
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).toBeVisible();

    // Hide Layer 1 (index 3) — only E1 highlight disappears
    await page.getByTestId("layerVisibility-3").click();
    await expect(e1Highlights).toHaveCount(0, { timeout: 2000 });
    await expect(e2Highlights).toHaveCount(1, { timeout: 2000 });

    // Show Layer 1, hide Layer 2 (index 4)
    await page.getByTestId("layerVisibility-3").click();
    await page.getByTestId("layerVisibility-4").click();
    await expect(e1Highlights).toHaveCount(1, { timeout: 2000 });
    await expect(e2Highlights).toHaveCount(0, { timeout: 2000 });
  });
});

test.describe("when toggling section visibility with layers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Add a fresh layer for tests.
    await page.getByTestId("addLayerButton").click();
  });

  test("when a passage is hidden, then its editor pane is hidden", async ({ page }) => {
    await expect(page.locator(".simple-editor-wrapper").nth(0)).toBeVisible();
    await expect(page.locator(".simple-editor-wrapper").nth(1)).toBeVisible();

    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.locator(".simple-editor-wrapper").nth(1)).not.toBeVisible({ timeout: 2000 });
    await expect(page.locator(".simple-editor-wrapper").nth(0)).toBeVisible();

    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.locator(".simple-editor-wrapper").nth(1)).toBeVisible({ timeout: 2000 });
  });

  test("when another passage is hidden, then arrows in visible editor persist", async ({ page }) => {
    await drawArrowInEditor(page, 0);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide passage 2 — arrow is in E1, should persist
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show passage 2 again
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("when destination passage is hidden, then cross-editor arrow disappears", async ({ page }) => {
    // Close management pane for cross-editor click
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    // Draw cross-editor arrow from E1 to E2
    await drawArrowBetweenEditors(page, 0, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Record arrow position before hiding
    const arrowBefore = await page.getByTestId("arrow-line").getAttribute("d");
    expect(arrowBefore).not.toBeNull();

    // Reopen management pane to toggle section visibility
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).toBeVisible();

    // Hide passage 2 — arrow endpoint is in hidden editor
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show passage 2 — arrow should reappear with correct position
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Verify arrow points to valid positions (not 0,0 or negative coords)
    const arrowAfter = await page.getByTestId("arrow-line").getAttribute("d");
    expect(arrowAfter).not.toBeNull();

    // Parse coordinates from the path "M x1 y1 L mx my L x2 y2"
    const coords = arrowAfter!.match(/[\d.]+/g)!.map(Number);
    // All coordinates should be positive (within the visible container)
    for (const c of coords) {
      expect(c).toBeGreaterThan(0);
    }
  });
});
