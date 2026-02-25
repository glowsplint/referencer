import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("lock toolbar", () => {

test("when editor is in default locked state, then toolbar is hidden", async ({ page }) => {
  // Editor starts locked — toolbar should not be visible
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
});

test("when lock button is clicked, then editor unlocks and shows toolbar", async ({ page }) => {
  // Editor starts locked
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

  await page.getByTestId("lockButton").click();

  await expect(page.getByTestId("editorToolbar")).toBeVisible();
  await expect(page.getByTestId("editorToolbar")).toHaveCSS("opacity", "1");
});

test("when lock button is clicked again, then editor re-locks and toolbar is removed", async ({ page }) => {
  const lockButton = page.getByTestId("lockButton");

  // Unlock
  await lockButton.click();
  await expect(page.getByTestId("editorToolbar")).toBeVisible();

  // Re-lock
  await lockButton.click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
});

}); // end lock toolbar describe
