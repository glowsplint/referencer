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

    // Intercept window.print to verify it gets called
    const printCalled = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        window.print = () => resolve(true);
        // Safety timeout in case print is never called
        setTimeout(() => resolve(false), 3000);
      });
    });

    // We need to trigger click separately since evaluate already set up the listener
    // Re-approach: set up intercept then click
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
