import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
});

test.describe("passage management", () => {

test("when management pane loads, then two default passages are shown", async ({ page }) => {
  await expect(page.getByTestId("passageName-0")).toHaveText("1 Corinthians 1:18\u201331");
  await expect(page.getByTestId("passageName-1")).toHaveText("1 Corinthians 2:6\u201316");
});

test("when add passage button is clicked, then a third passage is created", async ({ page }) => {
  await page.getByTestId("addPassageButton").click();
  await expect(page.getByTestId("passageName-2")).toBeVisible();
  await expect(page.getByTestId("passageName-2")).toHaveText("Passage 3");
});

test("when passage name is double-clicked, then edit mode is entered and rename works", async ({ page }) => {
  await page.getByTestId("passageName-0").dblclick();

  const input = page.getByTestId("passageNameInput-0");
  await expect(input).toBeVisible();

  await input.fill("Genesis 1");
  await input.press("Enter");

  await expect(page.getByTestId("passageName-0")).toHaveText("Genesis 1");
});

test("when section visibility is toggled, then title changes", async ({ page }) => {
  const toggle = page.getByTestId("sectionVisibility-0");
  await expect(toggle).toHaveAttribute("title", "Hide passage");

  await toggle.click();
  await expect(toggle).toHaveAttribute("title", "Show passage");
});

test("when a passage is added, then an additional editor pane is created", async ({ page }) => {
  const editorsBefore = await page.locator(".simple-editor-wrapper").count();
  await page.getByTestId("addPassageButton").click();
  const editorsAfter = await page.locator(".simple-editor-wrapper").count();

  expect(editorsAfter).toBe(editorsBefore + 1);
});

}); // end passage management describe
