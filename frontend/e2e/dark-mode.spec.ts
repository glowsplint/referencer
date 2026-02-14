import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("document starts without dark class", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);
});

test("toggling dark mode in settings adds dark class", async ({ page }) => {
  await page.getByTestId("settingsButton").click();
  await page.getByTestId("dark-mode-switch").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("toggling dark mode again in settings removes dark class", async ({ page }) => {
  await page.getByTestId("settingsButton").click();
  const toggle = page.getByTestId("dark-mode-switch");
  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await toggle.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
