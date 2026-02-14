import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
});

test("removing first passage twice does not crash toolbar", async ({ page }) => {
  // Start with 1 passage, add 2 more for a total of 3
  await page.getByTestId("addPassageButton").click();
  await page.getByTestId("addPassageButton").click();
  await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

  // Remove the first passage by dragging to trash
  await page.getByTestId("passageRow-0").dragTo(page.getByTestId("trashBin"));
  await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

  // Add another passage
  await page.getByTestId("addPassageButton").click();
  await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

  // Remove the first passage again — this previously crashed with
  // "Cannot read properties" error in SimpleEditorToolbar because
  // editorsRef pointed to destroyed editor instances
  await page.getByTestId("passageRow-0").dragTo(page.getByTestId("trashBin"));
  await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

  // Verify the toolbar is still functional (no error boundary triggered)
  await expect(page.getByTestId("editorToolbar")).toBeVisible();
});
