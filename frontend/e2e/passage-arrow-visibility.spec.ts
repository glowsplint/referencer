import { test, expect } from "@playwright/test";

// Click near the top of the paragraph's first line to avoid the arrow style
// picker overlay that appears when the arrow tool is activated.
const FIRST_LINE_Y_OFFSET = 15;

async function drawArrowInEditor(
  page: import("@playwright/test").Page,
  editorIndex: number,
  anchorXOffset = 30,
  targetXOffset = 120,
) {
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press("a");

  const p = page.locator(".simple-editor-wrapper").nth(editorIndex).locator("p").first();
  const box = await p.boundingBox();
  expect(box).not.toBeNull();

  // Select and confirm anchor
  await page.mouse.click(box!.x + anchorXOffset, box!.y + FIRST_LINE_Y_OFFSET);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");

  // Select and confirm target
  await page.mouse.click(box!.x + targetXOffset, box!.y + FIRST_LINE_Y_OFFSET);
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
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.keyboard.press("a");

  const srcP = page.locator(".simple-editor-wrapper").nth(sourceEditor).locator("p").first();
  const srcBox = await srcP.boundingBox();
  expect(srcBox).not.toBeNull();

  // Select and confirm anchor
  await page.mouse.click(srcBox!.x + anchorXOffset, srcBox!.y + FIRST_LINE_Y_OFFSET);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");

  const tgtP = page.locator(".simple-editor-wrapper").nth(targetEditor).locator("p").first();
  const tgtBox = await tgtP.boundingBox();
  expect(tgtBox).not.toBeNull();

  // Select and confirm target
  await page.mouse.click(tgtBox!.x + targetXOffset, tgtBox!.y + FIRST_LINE_Y_OFFSET);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });
  await page.keyboard.press("Enter");
  // Wait for status bar flash confirming arrow was created
  await page.waitForTimeout(300);
}

function parseArrowCoords(d: string): number[] {
  return d.match(/[\d.]+/g)!.map(Number);
}

test.describe("passage visibility with arrows (2 editors)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 2 passages and 3 default layers. Add a fresh layer.
    await page.getByTestId("addLayerButton").click();

    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("hiding source passage hides same-editor arrow, re-showing restores it", async ({
    page,
  }) => {
    await drawArrowInEditor(page, 0);
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

  test("cross-editor arrow hides when source passage is hidden", async ({ page }) => {
    await drawArrowBetweenEditors(page, 0, 1);
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
    await expect(page.locator(".simple-editor-wrapper").nth(1)).toBeVisible();

    // Re-show E1
    await page.getByTestId("sectionVisibility-0").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("hiding both passages hides all arrows, re-showing restores them", async ({ page }) => {
    // Draw cross-editor arrow E1→E2
    await drawArrowBetweenEditors(page, 0, 1);
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
    await expect(page.locator(".simple-editor-wrapper").nth(0)).not.toBeVisible();
    await expect(page.locator(".simple-editor-wrapper").nth(1)).not.toBeVisible();

    // Show both
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
  });

  test("combined layer hidden + section hidden restores correctly", async ({ page }) => {
    await drawArrowInEditor(page, 0);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    await page.getByTestId("menuButton").click();

    // Hide layer (index 3)
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Also hide section
    await page.getByTestId("sectionVisibility-0").click();

    // Show layer (section still hidden) — arrow should not appear
    await page.getByTestId("layerVisibility-3").click();
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
    await drawArrowInEditor(page, 0);
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

  test("drawing arrow in visible editor while other passage is hidden", async ({ page }) => {
    // Hide E2
    await page.getByTestId("menuButton").click();
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.locator(".simple-editor-wrapper").nth(1)).not.toBeVisible();
    await page.getByTestId("menuButton").click();

    // Draw arrow in E1 while E2 is hidden
    await drawArrowInEditor(page, 0);
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
    await drawArrowInEditor(page, 0);

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

    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 3; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }

    // Editor starts locked with 2 passages and 3 default layers.
    // Add one more passage for 3 total.
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

    // Unlock to type content in the empty 3rd editor, then re-lock
    await page.getByTestId("lockButton").click();
    const thirdEditor = page.locator(".simple-editor-wrapper").nth(2).locator(".ProseMirror");
    await thirdEditor.click();
    await page.keyboard.type("Alpha Beta Gamma Delta Epsilon Zeta Eta Theta");
    await page.getByTestId("lockButton").click();

    // Add two fresh layers at indices 3 and 4.
    await page.getByTestId("addLayerButton").click();
    await page.getByTestId("addLayerButton").click();
    await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");
    await expect(page.getByTestId("layerName-4")).toHaveText("Layer 2");

    // Activate Layer 1 (index 3)
    await page.getByTestId("layerName-3").click();
    await expect(page.getByTestId("layerActiveTag-3")).toBeVisible();

    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("hiding middle editor removes arrows to/from it, keeps E1-E3 arrow", async ({ page }) => {
    // Draw E1→E2 on Layer 1
    await drawArrowBetweenEditors(page, 0, 1);
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Draw E1→E3 on Layer 1 (use offset 60 for different anchor word)
    await drawArrowBetweenEditors(page, 0, 2, 60);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    // Switch to Layer 2, draw E2→E3
    await page.keyboard.press("Tab");
    await drawArrowBetweenEditors(page, 1, 2, 60);
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
    await expect(page.locator(".simple-editor-wrapper").nth(1)).not.toBeVisible();

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

  test("hiding E1 removes arrows originating from it, keeps E2-E3 arrow", async ({ page }) => {
    // Draw E1→E2 on Layer 1
    await drawArrowBetweenEditors(page, 0, 1);

    // Draw E1→E3 on Layer 1
    await drawArrowBetweenEditors(page, 0, 2, 60);

    // Draw E2→E3 on Layer 2
    await page.keyboard.press("Tab");
    await drawArrowBetweenEditors(page, 1, 2, 60);
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

  test("hiding E3 removes arrows targeting it, keeps E1-E2 arrow", async ({ page }) => {
    // Draw E1→E2 on Layer 1
    await drawArrowBetweenEditors(page, 0, 1);

    // Draw E1→E3 on Layer 1
    await drawArrowBetweenEditors(page, 0, 2, 60);

    // Draw E2→E3 on Layer 2
    await page.keyboard.press("Tab");
    await drawArrowBetweenEditors(page, 1, 2, 60);
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
    await drawArrowBetweenEditors(page, 0, 1);
    await drawArrowBetweenEditors(page, 0, 2, 60);

    // Draw E2→E3 on Layer 2
    await page.keyboard.press("Tab");
    await drawArrowBetweenEditors(page, 1, 2, 60);
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

  test("hiding all 3 passages hides all arrows and editors", async ({ page }) => {
    // Draw E1→E2 on Layer 1
    await drawArrowBetweenEditors(page, 0, 1);
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
      await expect(page.locator(".simple-editor-wrapper").nth(i)).not.toBeVisible();
    }

    // Show all 3
    await page.getByTestId("sectionVisibility-0").click();
    await page.getByTestId("sectionVisibility-1").click();
    await page.getByTestId("sectionVisibility-2").click();

    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });
    for (let i = 0; i < 3; i++) {
      await expect(page.locator(".simple-editor-wrapper").nth(i)).toBeVisible();
    }
  });

  test("layer + section visibility combined in 3-editor setup", async ({ page }) => {
    // Draw E1→E2 on Layer 1, E2→E3 on Layer 2
    await drawArrowBetweenEditors(page, 0, 1);

    await page.keyboard.press("Tab");
    await drawArrowBetweenEditors(page, 1, 2, 60);
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });

    await page.getByTestId("menuButton").click();

    // Hide Layer 1 (index 3) — only E2→E3 (Layer 2) remains
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(1, {
      timeout: 2000,
    });

    // Also hide E2 — E2→E3 also disappears
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show Layer 1 (E2 still hidden) — E1→E2 can't show because E2 hidden
    await page.getByTestId("layerVisibility-3").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(0, {
      timeout: 2000,
    });

    // Show E2 — both arrows should appear
    await page.getByTestId("sectionVisibility-1").click();
    await expect(page.getByTestId("arrow-line")).toHaveCount(2, {
      timeout: 2000,
    });
  });

  test("arrow coordinates remain valid after hide/show cycle", async ({ page }) => {
    // Draw E1→E3 on Layer 1
    await drawArrowBetweenEditors(page, 0, 2);
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
