import { test, expect } from "@playwright/test";

async function editorOfSelection(
  page: import("@playwright/test").Page,
  editorCount: number
) {
  for (let e = 0; e < editorCount; e++) {
    const count = await page
      .locator(".simple-editor-wrapper")
      .nth(e)
      .locator(".word-selection")
      .count();
    if (count > 0) return e;
  }
  return -1;
}

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

async function drawArrowRight(
  page: import("@playwright/test").Page,
  steps: number
) {
  await page.keyboard.down("a");
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(30);
  }
  await page.keyboard.up("a");
}

async function drawArrowToEditor(
  page: import("@playwright/test").Page,
  targetEditor: number,
  editorCount: number,
  maxSteps = 50
) {
  await page.keyboard.down("a");
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(30);
    if ((await editorOfSelection(page, editorCount)) === targetEditor) break;
  }
  await page.keyboard.up("a");
}

test.describe("cross-editor arrows (2 editors)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

    await clickWordInEditor(page, 0);
    expect(await editorOfSelection(page, 2)).toBe(0);
  });

  test("arrow can be drawn from editor 1 to editor 2", async ({ page }) => {
    await drawArrowToEditor(page, 1, 2);

    expect(await editorOfSelection(page, 2)).toBe(1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    await expect(page.getByTestId("preview-arrow")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("cross-editor arrow highlights appear in both editors", async ({
    page,
  }) => {
    await drawArrowToEditor(page, 1, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    const e1Highlights = page
      .locator(".simple-editor-wrapper")
      .nth(0)
      .locator('span[style*="background-color"]');
    const e2Highlights = page
      .locator(".simple-editor-wrapper")
      .nth(1)
      .locator('span[style*="background-color"]');

    await expect(e1Highlights.first()).toBeVisible({ timeout: 2000 });
    await expect(e2Highlights.first()).toBeVisible({ timeout: 2000 });
  });

  test("cross-editor arrow can be deleted by clicking", async ({ page }) => {
    await drawArrowToEditor(page, 1, 2);

    const arrowLine = page.getByTestId("arrow-line");
    await expect(arrowLine).toHaveCount(1, { timeout: 2000 });

    await arrowLine.click({ force: true });
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("hiding layer removes cross-editor arrow and all highlights", async ({
    page,
  }) => {
    await drawArrowToEditor(page, 1, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Reopen management pane to toggle visibility
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).toBeVisible();

    await page.getByTestId("layerVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    const highlights = page.locator(
      '.simple-editor span[style*="background-color"]'
    );
    await expect(highlights).toHaveCount(0, { timeout: 2000 });

    await page.getByTestId("layerVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });
});

test.describe("multiple layers (2 editors)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");
    await expect(page.getByTestId("layerName-1")).toHaveText("Layer 2");

    // Make Layer 1 active (Layer 2 is active by default as most recently added)
    await page.getByTestId("layerName-0").click();
    await expect(page.getByTestId("layerActiveTag-0")).toBeVisible();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("arrows on different layers are independent", async ({ page }) => {
    // Draw arrow on Layer 1 in E1
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Cycle to Layer 2
    await page.keyboard.press("l");
    await expect(page.getByTestId("layerActiveTag-1")).toBeVisible();

    // Draw arrow on Layer 2 in E2
    await clickWordInEditor(page, 1);
    await drawArrowRight(page, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });
  });

  test("toggling one layer visibility doesn't affect other layer's arrows", async ({
    page,
  }) => {
    // Draw arrow on Layer 1 in E1
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Cycle to Layer 2 and draw arrow in E2
    await page.keyboard.press("l");
    await clickWordInEditor(page, 1);
    await drawArrowRight(page, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    // Hide Layer 1 — only its arrow should disappear
    await page.getByTestId("layerVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show Layer 1, hide Layer 2
    await page.getByTestId("layerVisibility-0").click();
    await page.getByTestId("layerVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show both
    await page.getByTestId("layerVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });
  });

  test("'l' key cycles the active layer", async ({ page }) => {
    await expect(page.getByTestId("layerActiveTag-0")).toBeVisible();

    await page.keyboard.press("l");
    await expect(page.getByTestId("layerActiveTag-1")).toBeVisible();

    await page.keyboard.press("l");
    await expect(page.getByTestId("layerActiveTag-0")).toBeVisible();
  });

  test("highlights on different layers coexist across editors", async ({
    page,
  }) => {
    // Click word in E1 → highlight on Layer 1
    await clickWordInEditor(page, 0);

    const e1Highlights = page
      .locator(".simple-editor-wrapper")
      .nth(0)
      .locator('span[style*="background-color"]');
    await expect(e1Highlights).toHaveCount(1, { timeout: 2000 });

    // Cycle to Layer 2 and click word in E2
    await page.keyboard.press("l");
    await clickWordInEditor(page, 1, 60);

    const e2Highlights = page
      .locator(".simple-editor-wrapper")
      .nth(1)
      .locator('span[style*="background-color"]');
    await expect(e2Highlights).toHaveCount(1, { timeout: 2000 });
    // E1 highlight should still be visible
    await expect(e1Highlights).toHaveCount(1, { timeout: 2000 });

    // Hide Layer 1 — only E1 highlight disappears
    await page.getByTestId("layerVisibility-0").click();
    await expect(e1Highlights).toHaveCount(0, { timeout: 2000 });
    await expect(e2Highlights).toHaveCount(1, { timeout: 2000 });

    // Show Layer 1, hide Layer 2
    await page.getByTestId("layerVisibility-0").click();
    await page.getByTestId("layerVisibility-1").click();
    await expect(e1Highlights).toHaveCount(1, { timeout: 2000 });
    await expect(e2Highlights).toHaveCount(0, { timeout: 2000 });
  });
});

test.describe("section visibility with layers (2 editors)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("hiding a passage hides the editor pane", async ({ page }) => {
    await expect(
      page.locator(".simple-editor-wrapper").nth(0)
    ).toBeVisible();
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).toBeVisible();

    await page.getByTestId("sectionVisibility-1").click();
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).not.toBeVisible({ timeout: 2000 });
    await expect(
      page.locator(".simple-editor-wrapper").nth(0)
    ).toBeVisible();

    await page.getByTestId("sectionVisibility-1").click();
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).toBeVisible({ timeout: 2000 });
  });

  test("arrows in visible editor persist after hiding another passage", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 1);
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

  test("cross-editor arrow disappears when destination passage is hidden", async ({
    page,
  }) => {
    // Close management pane for cross-editor navigation
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    // Draw cross-editor arrow from E1 to E2
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 2);
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
