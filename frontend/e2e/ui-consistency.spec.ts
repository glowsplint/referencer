import { test, expect } from "@playwright/test";

async function clickWordInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  xOffset = 30,
) {
  const p = page.locator(".simple-editor-wrapper").nth(editorIndex).locator("p").first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + xOffset, box!.y + 12);
  await expect(page.locator(".word-selection").first()).toBeVisible({
    timeout: 2000,
  });
}

async function addAnnotation(page: import("@playwright/test").Page, text: string) {
  await page.keyboard.press("Enter");
  const input = page.getByPlaceholder("Add annotation...");
  await expect(input).toBeVisible({ timeout: 2000 });
  await input.fill(text);
  await input.press("Enter");
  await expect(page.getByText(text)).toBeVisible({ timeout: 2000 });
}

async function drawArrowInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  anchorXOffset = 30,
  targetXOffset = 120,
) {
  // Switch through selection tool first to clear any stale comments tool state
  await page.keyboard.press("s");
  await page.keyboard.press("a");

  const p = page.locator(".simple-editor-wrapper").nth(editorIndex).locator("p").first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();

  // Click on the first line of the paragraph (avoid center which may fall between wrapped lines)
  const clickY = box!.y + 12;

  // Select and confirm anchor
  await page.mouse.click(box!.x + anchorXOffset, clickY);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");

  // Wait for status bar to confirm anchor was accepted
  await expect(page.getByTestId("status-bar")).toContainText("select the target", {
    timeout: 2000,
  });

  // Select and confirm target
  await page.mouse.click(box!.x + targetXOffset, clickY);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  // Tool auto-switches to selection
}

async function drawArrowBetweenEditors(
  page: import("@playwright/test").Page,
  sourceEditor: number,
  targetEditor: number,
  anchorXOffset = 30,
  targetXOffset = 30,
) {
  // Switch through selection tool first to clear any stale comments tool state
  await page.keyboard.press("s");
  await page.keyboard.press("a");

  const srcP = page.locator(".simple-editor-wrapper").nth(sourceEditor).locator("p").first();
  const srcBox = await srcP.boundingBox();
  expect(srcBox).not.toBeNull();

  // Click on the first line of paragraphs (avoid center which may fall between wrapped lines)

  // Select and confirm anchor
  await page.mouse.click(srcBox!.x + anchorXOffset, srcBox!.y + 12);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");

  // Wait for status bar to confirm anchor was accepted
  await expect(page.getByTestId("status-bar")).toContainText("select the target", {
    timeout: 2000,
  });

  const tgtP = page.locator(".simple-editor-wrapper").nth(targetEditor).locator("p").first();
  const tgtBox = await tgtP.boundingBox();
  expect(tgtBox).not.toBeNull();

  // Select and confirm target
  await page.mouse.click(tgtBox!.x + targetXOffset, tgtBox!.y + 12);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  // Tool auto-switches to selection
}

test.describe("when layer is hidden", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 3 default layers. Add a fresh layer at index 3.
    await page.getByTestId("addLayerButton").click();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when layer is hidden, then all highlight decorations for that layer are removed", async ({ page }) => {
    // Create annotation to persist the highlight
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Highlight test");

    // Clear selection by pressing Escape
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });

    // Verify highlight exists
    const highlights = page.locator('.simple-editor span[style*="background-color"]');
    await expect(highlights.first()).toBeVisible({ timeout: 2000 });
    const countBefore = await highlights.count();
    expect(countBefore).toBeGreaterThan(0);

    // Hide test layer (index 3) — all its highlights should disappear
    await page.getByTestId("layerVisibility-3").click();
    await expect(highlights).toHaveCount(0, { timeout: 2000 });

    // No annotation panel either
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when layer is hidden, then arrow endpoint highlights are also removed", async ({ page }) => {
    // Draw an arrow
    await drawArrowInEditor(page, 0);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Arrow endpoint highlights should exist as inline decorations
    const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
    await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });

    // Hide test layer (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // Both arrows AND endpoint decorations should be gone
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(endpointDecorations).toHaveCount(0, { timeout: 2000 });
  });
});

test.describe("when passage is hidden", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 2 passages and 3 default layers. Add a fresh layer.
    await page.getByTestId("addLayerButton").click();

    // Close management pane for more editor space
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when passage is hidden and only annotation is in that passage, then annotation panel is removed", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Passage gone note");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Reopen management pane to toggle
    await page.getByTestId("menuButton").click();

    await page.getByTestId("sectionVisibility-0").click();

    // Annotation panel should disappear completely
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
    // No dangling text
    await expect(page.getByText("Passage gone note")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when destination passage is hidden, then cross-editor arrow disappears", async ({ page }) => {
    await drawArrowBetweenEditors(page, 0, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Reopen management pane
    await page.getByTestId("menuButton").click();

    // Hide passage 2 (destination)
    await page.getByTestId("sectionVisibility-1").click();

    // Arrow line should be gone (both endpoints must be visible for arrow to render)
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Destination editor should be hidden
    await expect(page.locator(".simple-editor-wrapper").nth(1)).not.toBeVisible();

    // Show passage 2 again — arrow should reappear
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });
});

test.describe("when checking connector line consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 3 default layers. Add a fresh layer at index 3.
    await page.getByTestId("addLayerButton").click();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when multiple annotations exist, then connector line count matches annotation card count", async ({ page }) => {
    // Create first annotation
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Note A");

    // Create second annotation
    await clickWordInEditor(page, 0, 100);
    await addAnnotation(page, "Note B");

    await expect(page.getByTestId("annotation-panel")).toBeVisible({
      timeout: 2000,
    });

    // Count connector lines in the annotation panel SVG
    const connectorLines = page.locator('[data-testid="annotation-panel"] svg line');
    const lineCount = await connectorLines.count();

    // Count visible annotation cards (divs with absolute positioning in the panel)
    const annotationCards = page.locator('[data-testid="annotation-panel"] .absolute.w-48');
    const cardCount = await annotationCards.count();

    // Each annotation card should have exactly one connector line
    expect(lineCount).toBe(cardCount);
    expect(lineCount).toBe(2);
  });

  test("when layer is hidden, then both connector lines and cards are removed", async ({ page }) => {
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Connector test");

    await expect(page.locator('[data-testid="annotation-panel"] svg line')).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide test layer (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // Panel should disappear entirely (no orphaned SVG elements)
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
  });
});

test.describe("when toggling visibility with arrows, highlights, and annotations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 2 passages and 3 default layers.
    // Add two fresh layers at indices 3 and 4.
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();

    // Activate Layer 1 (index 3)
    await page.getByTestId("layerName-3").click();

    // Close management pane for more space
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when layer is toggled, then arrows, highlights, and annotations all appear and disappear together", async ({ page }) => {
    // Create annotation on Layer 1 first (comments-mode click clears arrows — known bug)
    await clickWordInEditor(page, 0, 100);
    await addAnnotation(page, "Synced note");

    // Create arrow on Layer 1
    await drawArrowInEditor(page, 0);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Verify all present
    await expect(page.getByTestId("arrow-line")).toHaveCount(1);
    await expect(page.getByText("Synced note")).toBeVisible();

    // Arrow endpoint decorations should exist as inline decorations
    const endpointDecorations = page.locator(".ProseMirror .arrow-endpoint");
    await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });

    // Clear selection by pressing Escape
    await page.keyboard.press("Escape");
    await expect(page.locator(".word-selection")).toHaveCount(0, {
      timeout: 2000,
    });

    const highlights = page.locator('.simple-editor span[style*="background-color"]');
    const highlightsBefore = await highlights.count();
    expect(highlightsBefore).toBeGreaterThan(0);

    // Reopen management pane for layer toggle
    await page.getByTestId("menuButton").click();

    // Hide Layer 1 (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // All should be gone
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(page.getByText("Synced note")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(highlights).toHaveCount(0, { timeout: 2000 });
    await expect(endpointDecorations).toHaveCount(0, { timeout: 2000 });

    // Show Layer 1 (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // All should reappear
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByText("Synced note")).toBeVisible({ timeout: 2000 });
    const highlightsAfter = await highlights.count();
    expect(highlightsAfter).toBe(highlightsBefore);
    await expect(endpointDecorations).toHaveCount(2, { timeout: 2000 });
  });

  test("when layer 1 is toggled, then layer 2 elements are unaffected", async ({ page }) => {
    // Create annotation on Layer 1 (index 3)
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "L1 note");

    // Draw arrow on Layer 1
    await drawArrowInEditor(page, 0, 100, 200);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Reopen management pane to switch layers
    await page.getByTestId("menuButton").click();

    // Switch to Layer 2 (index 4)
    await page.getByTestId("layerName-4").click();
    await expect(page.getByTestId("layerActiveTag-4")).toBeVisible();

    // Close management pane for more editor space
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    // Switch back to comments tool after drawing arrow
    await page.keyboard.press("c");

    // Create annotation on Layer 2 in passage 2
    await clickWordInEditor(page, 1, 30);
    await addAnnotation(page, "L2 note");

    // Draw arrow on Layer 2 in passage 2
    await drawArrowInEditor(page, 1, 100, 200);

    // Both layers' arrows
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    // Reopen management pane for layer toggle
    await page.getByTestId("menuButton").click();

    // Hide Layer 1 (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // Layer 1 stuff gone, Layer 2 stuff remains
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByText("L1 note")).toHaveCount(0, { timeout: 2000 });
    await expect(page.getByText("L2 note")).toBeVisible({ timeout: 2000 });
  });

  test("when layer is toggled rapidly, then no dangling elements remain", async ({ page }) => {
    // Create annotation first (comments-mode click clears arrows — known bug)
    await clickWordInEditor(page, 0, 100);
    await addAnnotation(page, "Rapid test");

    // Create arrow on Layer 1
    await drawArrowInEditor(page, 0);

    // Reopen management pane for layer toggle
    await page.getByTestId("menuButton").click();

    // Rapid toggle 6 times (ends visible) — using index 3
    for (let i = 0; i < 6; i++) {
      await page.getByTestId("layerVisibility-3").click();
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);

    // Should be in consistent visible state
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByText("Rapid test")).toBeVisible({ timeout: 2000 });
  });

  test("when passage is toggled rapidly, then no dangling elements remain", async ({ page }) => {
    // Create annotation in passage 1
    await clickWordInEditor(page, 0, 30);
    await addAnnotation(page, "Rapid passage test");

    // Reopen management pane for section toggle
    await page.getByTestId("menuButton").click();

    // Rapid toggle passage 1: 5 times (ends hidden)
    for (let i = 0; i < 5; i++) {
      await page.getByTestId("sectionVisibility-0").click();
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);

    // Passage is hidden, annotation should be gone
    await expect(page.getByText("Rapid passage test")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show passage — annotation should come back
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByText("Rapid passage test")).toBeVisible({
      timeout: 2000,
    });
  });
});

test.describe("when all elements are hidden", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 3 default layers. Add a fresh layer at index 3.
    await page.getByTestId("addLayerButton").click();

    // Switch to comments tool
    await page.keyboard.press("c");
  });

  test("when all layers are hidden, then no visible artifacts remain", async ({ page }) => {
    // Create arrow + annotation
    await drawArrowInEditor(page, 0);
    // Switch back to comments tool after drawing arrow
    await page.keyboard.press("c");
    await clickWordInEditor(page, 0, 200);
    await addAnnotation(page, "Will hide");

    // Hide the test layer (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // Nothing should remain
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(page.getByTestId("annotation-panel")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(
      page.locator(
        '.simple-editor span[style*="background-color"]:not(.word-selection):not(.similar-text-highlight):not(.arrow-endpoint)',
      ),
    ).toHaveCount(0, { timeout: 2000 });
    await expect(page.locator(".ProseMirror .arrow-endpoint")).toHaveCount(0, { timeout: 2000 });

    // Word selection should still work (not layer-dependent)
    await clickWordInEditor(page, 0, 50);
    await expect(page.locator(".word-selection").first()).toBeVisible({
      timeout: 2000,
    });
  });

  test("when all layers are hidden, then arrow overlay SVG contains no arrow elements", async ({ page }) => {
    // Draw an arrow
    await drawArrowInEditor(page, 0);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide test layer (index 3)
    await page.getByTestId("layerVisibility-3").click();

    // The SVG overlay should exist but contain no arrow path elements
    const arrowOverlay = page.getByTestId("arrow-overlay");
    await expect(arrowOverlay).toBeVisible();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(page.getByTestId("preview-arrow")).toHaveCount(0, {
      timeout: 2000,
    });
  });
});
