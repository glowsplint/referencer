import { test, expect } from "@playwright/test";

test.describe("when pressing K key from inside editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
    // Editor starts locked — unlock it first so tests can verify K-key locking
    await page.getByTestId("lockButton").click();
    await expect(page.getByTestId("editorToolbar")).toBeVisible();
  });

  test("when K is pressed while editor is focused, then editor locks", async ({ page }) => {
    // Click inside the editor to focus it
    const editorContent = page.locator(".ProseMirror").first();
    await editorContent.click();
    await expect(editorContent).toBeFocused();

    // Press K — should lock even though focus is in contentEditable
    await page.keyboard.press("k");

    // Toolbar should disappear (editor is locked)
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0, {
      timeout: 2000,
    });
  });

  test("when K is pressed again, then editor unlocks", async ({ page }) => {
    // Click inside editor and lock
    const editorContent = page.locator(".ProseMirror").first();
    await editorContent.click();
    await page.keyboard.press("k");
    await expect(page.getByTestId("editorToolbar")).toHaveCount(0, {
      timeout: 2000,
    });

    // Press K again to unlock
    await page.keyboard.press("k");
    await expect(page.getByTestId("editorToolbar")).toBeVisible({
      timeout: 2000,
    });
  });

  test("when editor is unlocked, then status bar shows Esc K hint", async ({ page }) => {
    await expect(page.getByTestId("status-bar")).toContainText("Esc", {
      timeout: 2000,
    });
    await expect(page.getByTestId("status-bar")).toContainText("K", {
      timeout: 2000,
    });
  });
});
