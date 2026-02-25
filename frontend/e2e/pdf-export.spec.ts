import { test, expect } from "@playwright/test";

test.describe("when exporting PDF", () => {
  test("when workspace loads, then export PDF button is visible in title bar", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();

    const exportButton = page.getByTestId("exportPdfButton");
    await expect(exportButton).toBeVisible();
  });

  test("when export PDF button is clicked, then window.print is triggered", async ({ page }) => {
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
