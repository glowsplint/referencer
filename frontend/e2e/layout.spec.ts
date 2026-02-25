import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("editor layout toggle", () => {

test("when page loads, then editor container uses flex-row", async ({ page }) => {
  const container = page.getByTestId("editorContainer");
  await expect(container).toHaveClass(/flex-row/);
});

test("when layout button is clicked, then editor switches to flex-col", async ({ page }) => {
  await page.getByTestId("editorLayoutButton").click();
  const container = page.getByTestId("editorContainer");
  await expect(container).toHaveClass(/flex-col/);
});

test("when layout button is clicked again, then editor switches back to flex-row", async ({ page }) => {
  const button = page.getByTestId("editorLayoutButton");
  await button.click();
  await expect(page.getByTestId("editorContainer")).toHaveClass(/flex-col/);

  await button.click();
  await expect(page.getByTestId("editorContainer")).toHaveClass(/flex-row/);
});

}); // end editor layout toggle describe
