import { test, expect } from "@playwright/test";

test.describe("PDF export", () => {
  test("export PDF button exists in title bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    const exportButton = page.getByTestId("exportPdfButton");
    await expect(exportButton).toBeVisible();
  });

  test("clicking export PDF button triggers window.print", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    await page.evaluate(() => {
      (window as any).__printCalled = false;
      window.print = () => {
        (window as any).__printCalled = true;
      };
    });

    await page.getByTestId("exportPdfButton").click();

    const wasCalled = await page.evaluate(() => (window as any).__printCalled);
    expect(wasCalled).toBe(true);
  });
});
