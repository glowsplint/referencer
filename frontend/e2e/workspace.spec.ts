import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test.describe("workspace", () => {

test("when workspace loads, then all editing tool buttons are visible", async ({ page }) => {
  await expect(page.getByTestId("keyboardShortcutsButton")).toBeVisible();
  await expect(page.getByTestId("faqButton")).toBeVisible();
  await expect(page.getByTestId("settingsButton")).toBeVisible();
  await expect(page.getByTestId("selectionToolButton")).toBeVisible();
  await expect(page.getByTestId("arrowToolButton")).toBeVisible();
  await expect(page.getByTestId("commentsToolButton")).toBeVisible();
  await expect(page.getByTestId("menuButton")).toBeVisible();
  await expect(page.getByTestId("editorLayoutButton")).toBeVisible();
  await expect(page.getByTestId("lockButton")).toBeVisible();
});

test("when workspace loads, then title bar shows default Title text", async ({ page }) => {
  await expect(page.getByText("Title")).toBeVisible();
});

test("when workspace loads, then share button is visible in title bar", async ({ page }) => {
  await expect(page.getByTestId("shareButton")).toBeVisible();
});

test("when share button is clicked, then share dialog opens with share options", async ({ page }) => {
  await page.getByTestId("shareButton").click();
  await expect(page.getByTestId("shareDialog")).toBeVisible();
  await expect(page.getByTestId("shareReadonlyButton")).toBeVisible();
  await expect(page.getByTestId("shareEditButton")).toBeVisible();
});

test("when workspace loads, then at least one editor pane is visible", async ({ page }) => {
  await expect(page.locator(".simple-editor-wrapper").first()).toBeVisible();
});

test("when workspace loads, then management pane is visible by default", async ({ page }) => {
  await expect(page.getByTestId("managementPane")).toBeVisible();
});

test("when title is clicked and renamed, then new name is displayed", async ({ page }) => {
  // Click the title to enter edit mode
  await page.getByText("Title").click();

  // Should show an input
  const input = page.locator("input[spellcheck='false']");
  await expect(input).toBeVisible();

  // Clear and type new name
  await input.fill("My Study");
  await input.press("Enter");

  // Should show new name
  await expect(page.getByText("My Study")).toBeVisible();
});

}); // end workspace describe
