import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 667 } });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("mobile readonly", () => {

test("when page loads on mobile, then mobile info dialog is shown", async ({ page }) => {
  const dialog = page.getByTestId("mobileInfoDialog");
  await expect(dialog).toBeVisible();
  await expect(page.getByText("Best on Desktop")).toBeVisible();
  await expect(page.getByText(/designed for desktop use/)).toBeVisible();
});

test("when dismiss button is clicked, then mobile info dialog is hidden", async ({ page }) => {
  const dialog = page.getByTestId("mobileInfoDialog");
  await expect(dialog).toBeVisible();

  await page.getByTestId("mobileInfoDismissButton").click();
  await expect(dialog).not.toBeVisible();
});

test("when page loads on mobile, then ButtonPane is hidden", async ({ page }) => {
  await expect(page.getByTestId("buttonPane")).not.toBeVisible();
});

test("when dialog is dismissed on mobile, then editor is visible and read-only", async ({ page }) => {
  // Dismiss dialog first
  await page.getByTestId("mobileInfoDismissButton").click();

  // Editor should be visible
  const editor = page.getByTestId("editorContainer");
  await expect(editor).toBeVisible();

  // Editor should be read-only (contenteditable=false on the tiptap editor)
  const prosemirror = page.locator(".tiptap");
  await expect(prosemirror.first()).toHaveAttribute("contenteditable", "false");
});

}); // end mobile readonly describe
