import { test, expect } from "@playwright/test";
import { setupDocument } from "./helpers";

async function editorOfSelection(page: import("@playwright/test").Page, editorCount: number) {
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

test.describe("when navigating across 2 editors", () => {
  test.beforeEach(async ({ page }) => {
    await setupDocument(page);
    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 4; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }
    // Editor starts locked with 2 texts. Close management pane for more space.
    await expect(page.getByTestId("managementPane")).toBeVisible();
    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("when ArrowRight is pressed repeatedly, then selection crosses from editor 1 to editor 2", async ({
    page,
  }) => {
    // Click any word in editor 0, then jump to its last word with End
    const p = page.locator(".simple-editor-wrapper").nth(0).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("End");
    await page.waitForTimeout(50);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(30);
      if ((await editorOfSelection(page, 2)) === 1) break;
    }

    expect(await editorOfSelection(page, 2)).toBe(1);
  });

  test("when ArrowLeft is pressed repeatedly, then selection crosses from editor 2 to editor 1", async ({
    page,
  }) => {
    // Click any word in editor 1, then jump to its first word with Home
    const p = page.locator(".simple-editor-wrapper").nth(1).locator("p").first();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Home");
    await page.waitForTimeout(50);

    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(30);
      if ((await editorOfSelection(page, 2)) === 0) break;
    }

    expect(await editorOfSelection(page, 2)).toBe(0);
  });
});

test.describe("when navigating across 3 editors", () => {
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await setupDocument(page);
    // Hide default layers so their arrows/highlights don't interfere with tests
    for (let i = 0; i < 4; i++) {
      await page.getByTestId(`layerVisibility-${i}`).click();
    }
    // Editor starts locked with 2 texts. Add one more for 3 total.
    await expect(page.getByTestId("managementPane")).toBeVisible();
    await page.getByTestId("addTextButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

    // Focus the 3rd editor pane so the lock button targets it
    await page
      .locator(".simple-editor-wrapper")
      .nth(2)
      .evaluate((el) => {
        el.setAttribute("tabindex", "-1");
        el.focus();
      });
    await page.waitForTimeout(100);

    // Unlock the focused pane (now pane 2) to type content, then re-lock
    await page.getByTestId("lockButton").click();
    const thirdPM = page.locator(".simple-editor-wrapper").nth(2).locator(".ProseMirror");
    await expect(thirdPM).toHaveAttribute("contenteditable", "true", { timeout: 5000 });
    await thirdPM.click();
    await page.keyboard.type("Alpha Beta Gamma Delta Epsilon Zeta Eta Theta");
    await page.getByTestId("lockButton").click();

    await page.getByTestId("menuButton").click();
    await expect(page.getByTestId("managementPane")).not.toBeVisible();
  });

  test("when ArrowDown is pressed from E1, then selection eventually reaches E3 (below in grid)", async ({
    page,
  }) => {
    // In grid layout, editors 0 and 1 are side-by-side in the top row,
    // editor 2 is in the bottom row. ArrowDown from E1 goes directly to E3.
    const paragraphs = page.locator(".simple-editor-wrapper").nth(0).locator("p");
    const lastP = paragraphs.last();
    await lastP.scrollIntoViewIfNeeded();
    const box = await lastP.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    let reachedE3 = false;

    for (let i = 0; i < 150; i++) {
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(20);
      const ed = await editorOfSelection(page, 3);
      if (ed === 2) {
        reachedE3 = true;
        break;
      }
    }

    expect(reachedE3).toBe(true);
  });

  test("when ArrowUp is pressed from E3, then selection reaches a top-row editor", async ({
    page,
  }) => {
    // Click a word in E3 (bottom row, full width).
    // "Alpha" is left-aligned, sitting below E1 (editor 0) in the 2-row grid,
    // so ArrowUp should reach E1 (editorIndex 0) rather than E2 (editorIndex 1).
    const p = page.locator(".simple-editor-wrapper").nth(2).locator("p").first();
    await p.scrollIntoViewIfNeeded();
    const box = await p.boundingBox();
    await page.mouse.click(box!.x + 10, box!.y + box!.height / 2);
    await expect(page.locator(".word-selection").first()).toBeVisible({ timeout: 2000 });

    let reachedTopRow = false;

    for (let i = 0; i < 150; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(30);
      const ed = await editorOfSelection(page, 3);
      if (ed === 0 || ed === 1) {
        reachedTopRow = true;
        break;
      }
    }

    expect(reachedTopRow).toBe(true);
  });

  test("when ArrowDown crosses editors, then ArrowUp crosses back", async ({ page }) => {
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
      if (ed !== 0) {
        crossedDown = true;
        break;
      }
      if (ed === prevEd) {
        // Check if stuck
        await page.keyboard.press("ArrowDown");
        await page.waitForTimeout(30);
        const ed2 = await editorOfSelection(page, 3);
        if (ed2 !== 0) {
          crossedDown = true;
          break;
        }
      }
      prevEd = ed;
    }
    expect(crossedDown).toBe(true);

    // ArrowUp back to E1
    let crossedUp = false;
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press("ArrowUp");
      await page.waitForTimeout(30);
      if ((await editorOfSelection(page, 3)) === 0) {
        crossedUp = true;
        break;
      }
    }
    expect(crossedUp).toBe(true);
  });
});
