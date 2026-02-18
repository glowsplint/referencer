import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("toolbar is hidden when locked (default state)", async ({ page }) => {
  // Editor starts locked — toolbar should not be visible
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
});

test("clicking lock button unlocks and shows toolbar", async ({ page }) => {
  // Editor starts locked
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

  await page.getByTestId("lockButton").click();

  await expect(page.getByTestId("editorToolbar")).toBeVisible();
  await expect(page.getByTestId("editorToolbar")).toHaveCSS("opacity", "1");
});

test("clicking lock button again re-locks and removes toolbar", async ({ page }) => {
  const lockButton = page.getByTestId("lockButton");

  // Unlock
  await lockButton.click();
  await expect(page.getByTestId("editorToolbar")).toBeVisible();

  // Re-lock
  await lockButton.click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
});
