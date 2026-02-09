import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("editor container starts with flex-row", async ({ page }) => {
  const container = page.getByTestId("editorContainer");
  await expect(container).toHaveClass(/flex-row/);
});

test("clicking layout button switches to flex-col", async ({ page }) => {
  await page.getByTestId("editorLayoutButton").click();
  const container = page.getByTestId("editorContainer");
  await expect(container).toHaveClass(/flex-col/);
});

test("clicking layout button again switches back to flex-row", async ({ page }) => {
  const button = page.getByTestId("editorLayoutButton");
  await button.click();
  await expect(page.getByTestId("editorContainer")).toHaveClass(/flex-col/);

  await button.click();
  await expect(page.getByTestId("editorContainer")).toHaveClass(/flex-row/);
});
