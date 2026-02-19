import { test, expect } from "@playwright/test";

async function editorOfSelection(page: import("@playwright/test").Page, editorCount: number) {
  for (let e = 0; e < editorCount; e++) {
    const count = await page.locator(".simple-editor-wrapper").nth(e).locator(".word-selection").count();
    if (count > 0) return e;
  }
  return -1;
}

test.describe("cross-editor navigation (2 editors)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 4; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }
    // Editor starts locked with 2 passages. Close management pane for more space.
    await expect(page.getByTestId("managementPane")).toBeVisible();
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("ArrowRight crosses from editor 1 to editor 2 on same visual row", async ({ page }) => {
    const p = page.locator(".simple-editor-wrapper").nth(0).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(30);
      if ((await editorOfSelection(page, 2)) === 1) break;
    }

    expect(await editorOfSelection(page, 2)).toBe(1);
  });

  test("ArrowLeft crosses from editor 2 to editor 1 on same visual row", async ({ page }) => {
    const p = page.locator(".simple-editor-wrapper").nth(1).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(30);
      if ((await editorOfSelection(page, 2)) === 0) break;
    }

    expect(await editorOfSelection(page, 2)).toBe(0);
  });
});

test.describe("cross-editor navigation (3 editors)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 4; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }
    // Editor starts locked with 2 passages. Add one more for 3 total.
    await expect(page.getByTestId("managementPane")).toBeVisible();
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

    // Unlock to type content in the empty 3rd editor, then re-lock
    await page.getByTestId("lockButton").click();
    const thirdEditor = page.locator(".simple-editor-wrapper").nth(2).locator(".ProseMirror");
    await thirdEditor.click();
    await page.keyboard.type("Alpha Beta Gamma Delta Epsilon Zeta Eta Theta");
    await page.getByTestId("lockButton").click();

    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("ArrowDown from E1 eventually reaches E2 and E3", async ({ page }) => {
    // Click a word in E1
    const p = page.locator(".simple-editor-wrapper").nth(0).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + 10);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    let reachedE2 = false, reachedE3 = false;

    for (let i = 0; i < 150; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(30);
      const ed = await editorOfSelection(page, 3);
      if (ed === 1) reachedE2 = true;
      if (ed === 2) { reachedE3 = true; break; }
    }

    expect(reachedE2).toBe(true);
    expect(reachedE3).toBe(true);
  });

  test("ArrowUp from E3 reaches E2", async ({ page }) => {
    // Click a word in E3
    const p = page.locator(".simple-editor-wrapper").nth(2).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    let reachedE2 = false;

    for (let i = 0; i < 150; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(30);
      const ed = await editorOfSelection(page, 3);
      if (ed === 1) { reachedE2 = true; break; }
    }

    expect(reachedE2).toBe(true);
  });

  test("ArrowDown crosses editors and ArrowUp crosses back", async ({ page }) => {
    const p = page.locator(".simple-editor-wrapper").nth(0).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    // ArrowDown until crossing out of E1
    let crossedDown = false;
    let prevEd = 0;
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(30);
      const ed = await editorOfSelection(page, 3);
      if (ed !== 0) { crossedDown = true; break; }
      if (ed === prevEd) {
        // Check if stuck
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(30);
        const ed2 = await editorOfSelection(page, 3);
        if (ed2 !== 0) { crossedDown = true; break; }
      }
      prevEd = ed;
    }
    expect(crossedDown).toBe(true);

    // ArrowUp back to E1
    let crossedUp = false;
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(30);
      if ((await editorOfSelection(page, 3)) === 0) { crossedUp = true; break; }
    }
    expect(crossedUp).toBe(true);
  });
});
