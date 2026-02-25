import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("dark mode", () => {

test("when page loads, then document does not have dark class", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);
});

test("when dark mode is toggled in settings, then dark class is added", async ({ page }) => {
  await page.getByTestId("settingsButton").click();
  await page.getByTestId("dark-mode-switch").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("when dark mode is toggled again, then dark class is removed", async ({ page }) => {
  await page.getByTestId("settingsButton").click();
  const toggle = page.getByTestId("dark-mode-switch");
  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await toggle.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

}); // end dark mode describe
