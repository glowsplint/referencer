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
    await expect(page.getByTestId("managementPane")).toBeVisible();
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCSS("opacity", "0");
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
    await expect(page.getByTestId("managementPane")).toBeVisible();
    await page.getByTestId("addPassageButton").click();
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toHaveCSS("opacity", "0");
  });

  test("ArrowRight traverses E1 → E2 → E3 on same visual row, then wraps to next row at E1", async ({ page }) => {
    const p = page.locator(".simple-editor-wrapper").nth(0).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    const startY = (await page.locator(".word-selection").first().boundingBox())!.y;
    let reachedE2 = false, reachedE3 = false, wrappedToE1 = false;

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(30);
      const ed = await editorOfSelection(page, 3);
      const selBox = await page.locator(".word-selection").first().boundingBox();
      if (ed === 1 && !reachedE2) reachedE2 = true;
      if (ed === 2 && !reachedE3) reachedE3 = true;
      // After reaching E3, check if we wrap back to E1 on a new row
      if (reachedE3 && ed === 0 && selBox && Math.abs(selBox.y - startY) > 15) {
        wrappedToE1 = true;
        break;
      }
    }

    expect(reachedE2).toBe(true);
    expect(reachedE3).toBe(true);
    expect(wrappedToE1).toBe(true);
  });

  test("ArrowLeft traverses E3 → E2 → E1 on same visual row, then wraps to previous row at E3", async ({ page }) => {
    // Click a word in E3 and navigate to a line that isn't the first
    const p = page.locator(".simple-editor-wrapper").nth(2).locator("p").first();
    const box = await p.boundingBox();
    // Click in the middle of the paragraph to start on a middle line
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    const startY = (await page.locator(".word-selection").first().boundingBox())!.y;
    let reachedE2 = false, reachedE1 = false, wrappedToE3 = false;

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(30);
      const ed = await editorOfSelection(page, 3);
      const selBox = await page.locator(".word-selection").first().boundingBox();
      if (ed === 1 && !reachedE2) reachedE2 = true;
      if (ed === 0 && !reachedE1) reachedE1 = true;
      if (reachedE1 && ed === 2 && selBox && selBox.y < startY - 15) {
        wrappedToE3 = true;
        break;
      }
    }

    expect(reachedE2).toBe(true);
    expect(reachedE1).toBe(true);
    expect(wrappedToE3).toBe(true);
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
