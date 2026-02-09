import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // Open management pane
  await page.getByTestId("menuButton").click();
  await expect(page.getByTestId("managementPane")).toBeVisible();
});

test("shows one passage by default", async ({ page }) => {
  await expect(page.getByTestId("passageName-0")).toHaveText("Passage 1");
});

test("add passage creates a second passage", async ({ page }) => {
  await page.getByTestId("addPassageButton").click();
  await expect(page.getByTestId("passageName-1")).toBeVisible();
  await expect(page.getByTestId("passageName-1")).toHaveText("Passage 2");
});

test("double-click passage name enters edit mode and rename", async ({ page }) => {
  await page.getByTestId("passageName-0").dblclick();

  const input = page.getByTestId("passageNameInput-0");
  await expect(input).toBeVisible();

  await input.fill("Genesis 1");
  await input.press("Enter");

  await expect(page.getByTestId("passageName-0")).toHaveText("Genesis 1");
});

test("section visibility toggle changes title", async ({ page }) => {
  const toggle = page.getByTestId("sectionVisibility-0");
  await expect(toggle).toHaveAttribute("title", "Hide passage");

  await toggle.click();
  await expect(toggle).toHaveAttribute("title", "Show passage");
});

test("adding a passage creates a second editor pane", async ({ page }) => {
  const editorsBefore = await page.locator(".simple-editor-wrapper").count();
  await page.getByTestId("addPassageButton").click();
  const editorsAfter = await page.locator(".simple-editor-wrapper").count();

  expect(editorsAfter).toBe(editorsBefore + 1);
});
