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
  // Dismiss any auto-focused annotation input so arrow keys navigate words
  await page.keyboard.press("Escape");
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
  maxSteps = 80
) {
  // Dismiss any auto-focused annotation input so arrow keys navigate words
  await page.keyboard.press("Escape");
  await page.keyboard.down("a");
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(30);
    if ((await editorOfSelection(page, editorCount)) === targetEditor) break;
  }
  await page.keyboard.up("a");
}

function parseArrowCoords(d: string): number[] {
  return d.match(/[\d.]+/g)!.map(Number);
}

test.describe("passage visibility with arrows (2 editors)", () => {
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
  });

  test("hiding source passage hides same-editor arrow, re-showing restores it", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide E1 (source passage)
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Re-show E1 — arrow should reappear with valid coordinates
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    const d = await page.getByTestId("arrow-line").getAttribute("d");
    const coords = parseArrowCoords(d!);
    for (const c of coords) {
      expect(c).toBeGreaterThan(0);
    }
  });

  test("cross-editor arrow hides when source passage is hidden", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide E1 (source)
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // E2 should still be visible
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).toBeVisible();

    // Re-show E1
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("hiding both passages hides all arrows, re-showing restores them", async ({
    page,
  }) => {
    // Draw cross-editor arrow E1→E2
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide both passages
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();

    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    await expect(
      page.locator(".simple-editor-wrapper").nth(0)
    ).not.toBeVisible();
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).not.toBeVisible();

    // Show both
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("combined layer hidden + section hidden restores correctly", async ({
    page,
  }) => {
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    await page.getByTestId("menuButton").click();

    // Hide layer
    await page.getByTestId("layerVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Also hide section
    await page.getByTestId("sectionVisibility-0").click();

    // Show layer (section still hidden) — arrow should not appear
    await page.getByTestId("layerVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show section — arrow should appear
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("rapid section toggle does not lose arrows", async ({ page }) => {
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    await page.getByTestId("menuButton").click();

    // Toggle 5 times rapidly (ends hidden)
    for (let i = 0; i < 5; i++) {
      await page.getByTestId("sectionVisibility-0").click();
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show passage — arrow should still exist
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("drawing arrow in visible editor while other passage is hidden", async ({
    page,
  }) => {
    // Hide E2
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-1").click();
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).not.toBeVisible();
    await page.getByTestId("menuButton").click();

    // Draw arrow in E1 while E2 is hidden
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 2);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show E2 — arrow in E1 should persist
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("highlights persist after hide/show cycle", async ({ page }) => {
    await clickWordInEditor(page, 0);
    await drawArrowRight(page, 2);

    const countBefore = await page
      .locator('.simple-editor span[style*="background-color"]:not(.word-selection)')
      .count();
    expect(countBefore).toBeGreaterThan(0);

    // Hide and show E1
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-0").click();
    await page.waitForTimeout(300);
    await page.getByTestId("sectionVisibility-0").click();
    await page.waitForTimeout(300);

    const countAfter = await page
      .locator('.simple-editor span[style*="background-color"]:not(.word-selection)')
      .count();
    expect(countAfter).toBe(countBefore);
  });
});

test.describe("passage visibility with arrows (3 editors)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.getByTestId("addPassageButton").click();
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");
    await expect(page.getByTestId("layerName-1")).toHaveText("Layer 2");

    // Activate Layer 1
    await page.getByTestId("layerName-0").click();
    await expect(page.getByTestId("layerActiveTag-0")).toBeVisible();

    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();

    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
  });

  test("hiding middle editor removes arrows to/from it, keeps E1-E3 arrow", async ({
    page,
  }) => {
    // Draw E1→E2 on Layer 1
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Draw E1→E3 on Layer 1
    await clickWordInEditor(page, 0, 60);
    await drawArrowToEditor(page, 2, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    // Switch to Layer 2, draw E2→E3
    await page.keyboard.press("l");
    await clickWordInEditor(page, 1, 60);
    await drawArrowToEditor(page, 2, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });

    // Hide E2 — E1→E2 and E2→E3 should disappear, E1→E3 should remain
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // E2 should not be visible
    await expect(
      page.locator(".simple-editor-wrapper").nth(1)
    ).not.toBeVisible();

    // Remaining arrow has valid coordinates
    const d = await page.getByTestId("arrow-line").getAttribute("d");
    const coords = parseArrowCoords(d!);
    for (const c of coords) {
      expect(c).toBeGreaterThan(0);
    }

    // Show E2 — all 3 arrows should reappear
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });
  });

  test("hiding E1 removes arrows originating from it, keeps E2-E3 arrow", async ({
    page,
  }) => {
    // Draw E1→E2 on Layer 1
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 3);

    // Draw E1→E3 on Layer 1
    await clickWordInEditor(page, 0, 60);
    await drawArrowToEditor(page, 2, 3);

    // Draw E2→E3 on Layer 2
    await page.keyboard.press("l");
    await clickWordInEditor(page, 1, 60);
    await drawArrowToEditor(page, 2, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });

    // Hide E1
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show E1
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });
  });

  test("hiding E3 removes arrows targeting it, keeps E1-E2 arrow", async ({
    page,
  }) => {
    // Draw E1→E2 on Layer 1
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 3);

    // Draw E1→E3 on Layer 1
    await clickWordInEditor(page, 0, 60);
    await drawArrowToEditor(page, 2, 3);

    // Draw E2→E3 on Layer 2
    await page.keyboard.press("l");
    await clickWordInEditor(page, 1, 60);
    await drawArrowToEditor(page, 2, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });

    // Hide E3
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-2").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Show E3
    await page.getByTestId("sectionVisibility-2").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });
  });

  test("hiding E1 and E3 removes all arrows", async ({ page }) => {
    // Draw E1→E2, E1→E3 on Layer 1
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 3);
    await clickWordInEditor(page, 0, 60);
    await drawArrowToEditor(page, 2, 3);

    // Draw E2→E3 on Layer 2
    await page.keyboard.press("l");
    await clickWordInEditor(page, 1, 60);
    await drawArrowToEditor(page, 2, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });

    // Hide E1 and E3
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-2").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show both — all arrows restored
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-2").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(3, {
      timeout: 2000,
    });
  });

  test("hiding all 3 passages hides all arrows and editors", async ({
    page,
  }) => {
    // Draw E1→E2 on Layer 1
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Hide all 3
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();
    await page.getByTestId("sectionVisibility-2").click();

    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });
    for (let i = 0; i < 3; i++) {
      await expect(
        page.locator(".simple-editor-wrapper").nth(i)
      ).not.toBeVisible();
    }

    // Show all 3
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();
    await page.getByTestId("sectionVisibility-2").click();

    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    for (let i = 0; i < 3; i++) {
      await expect(
        page.locator(".simple-editor-wrapper").nth(i)
      ).toBeVisible();
    }
  });

  test("layer + section visibility combined in 3-editor setup", async ({
    page,
  }) => {
    // Draw E1→E2 on Layer 1, E2→E3 on Layer 2
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 1, 3);

    await page.keyboard.press("l");
    await clickWordInEditor(page, 1, 60);
    await drawArrowToEditor(page, 2, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    await page.getByTestId("menuButton").click();

    // Hide Layer 1 — only E2→E3 (Layer 2) remains
    await page.getByTestId("layerVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Also hide E2 — E2→E3 also disappears
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show Layer 1 (E2 still hidden) — E1→E2 can't show because E2 hidden
    await page.getByTestId("layerVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show E2 — both arrows should appear
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });
  });

  test("arrow coordinates remain valid after hide/show cycle", async ({
    page,
  }) => {
    // Draw E1→E3 on Layer 1
    await clickWordInEditor(page, 0);
    await drawArrowToEditor(page, 2, 3);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Open management pane first so layout is consistent before/after
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).toBeVisible();
    await page.waitForTimeout(300);

    // Record arrow position (with management pane open)
    const dBefore = await page.getByTestId("arrow-line").getAttribute("d");
    const coordsBefore = parseArrowCoords(dBefore!);

    // Hide E2 (middle), then show — arrow should have same coordinates
    await page.getByTestId("sectionVisibility-1").click();
    await page.waitForTimeout(300);
    await page.getByTestId("sectionVisibility-1").click();
    await page.waitForTimeout(500);

    const dAfter = await page.getByTestId("arrow-line").getAttribute("d");
    const coordsAfter = parseArrowCoords(dAfter!);

    // Coordinates should match (E1→E3 arrow unaffected by E2 toggle)
    expect(coordsAfter.length).toBe(coordsBefore.length);
    for (let i = 0; i < coordsBefore.length; i++) {
      expect(coordsAfter[i]).toBeCloseTo(coordsBefore[i], 0);
    }
  });
});
