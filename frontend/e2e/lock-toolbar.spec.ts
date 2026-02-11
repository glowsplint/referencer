import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("toolbar is visible when unlocked", async ({ page }) => {
  const toolbar = page.getByTestId("editorToolbar");
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveCSS("opacity", "1");
});

test("clicking lock button removes toolbar from DOM", async ({ page }) => {
  await page.getByTestId("lockButton").click();

  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);
});

test("clicking lock button again restores toolbar", async ({ page }) => {
  const lockButton = page.getByTestId("lockButton");
  await lockButton.click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

  await lockButton.click();
  await expect(page.getByTestId("editorToolbar")).toBeVisible();
});
