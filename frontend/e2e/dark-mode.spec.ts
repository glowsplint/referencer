import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("document starts without dark class", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/dark/);
});

test("clicking dark mode button adds dark class", async ({ page }) => {
  await page.getByTestId("darkModeButton").click();
  const html = page.locator("html");
  await expect(html).toHaveClass(/dark/);
});

test("clicking dark mode button again removes dark class", async ({ page }) => {
  const button = page.getByTestId("darkModeButton");
  await button.click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  await button.click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
