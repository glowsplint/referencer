import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 667 } });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows mobile info dialog on load", async ({ page }) => {
  const dialog = page.getByTestId("mobileInfoDialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByText("Best on Desktop")).toBeVisible();
  await expect(page.getByText(/designed for desktop use/)).toBeVisible();
});

test("dismisses mobile info dialog with button", async ({ page }) => {
  const dialog = page.getByTestId("mobileInfoDialog");
  await expect(dialog).toBeVisible();

  await page.getByTestId("mobileInfoDismissButton").click();
  await expect(dialog).not.toBeVisible();
});

test("hides ButtonPane on mobile", async ({ page }) => {
  await expect(page.getByTestId("buttonPane")).not.toBeVisible();
});

test("editor is visible and read-only on mobile", async ({ page }) => {
  // Dismiss dialog first
  await page.getByTestId("mobileInfoDismissButton").click();

  // Editor should be visible
  const editor = page.getByTestId("editorContainer");
  await expect(editor).toBeVisible();

  // Editor should be read-only (contenteditable=false on the tiptap editor)
  const prosemirror = page.locator(".tiptap");
  await expect(prosemirror.first()).toHaveAttribute("contenteditable", "false");
});
