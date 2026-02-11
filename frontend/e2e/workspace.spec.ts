import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("renders all 8 button pane buttons", async ({ page }) => {
  await expect(page.getByTestId("keyboardShortcutsButton")).toBeVisible();
  await expect(page.getByTestId("selectionToolButton")).toBeVisible();
  await expect(page.getByTestId("arrowToolButton")).toBeVisible();
  await expect(page.getByTestId("commentsToolButton")).toBeVisible();
  await expect(page.getByTestId("menuButton")).toBeVisible();
  await expect(page.getByTestId("darkModeButton")).toBeVisible();
  await expect(page.getByTestId("editorLayoutButton")).toBeVisible();
  await expect(page.getByTestId("lockButton")).toBeVisible();
});

test("renders title bar with default Title text", async ({ page }) => {
  await expect(page.getByText("Title")).toBeVisible();
});

test("renders share button in title bar", async ({ page }) => {
  await expect(page.getByTestId("shareButton")).toBeVisible();
});

test("share button opens share dialog", async ({ page }) => {
  await page.getByTestId("shareButton").click();
  await expect(page.getByTestId("shareDialog")).toBeVisible();
  await expect(page.getByTestId("shareReadonlyButton")).toBeVisible();
  await expect(page.getByTestId("shareEditButton")).toBeVisible();
});

test("renders at least one editor pane", async ({ page }) => {
  await expect(page.locator(".simple-editor-wrapper").first()).toBeVisible();
});

test("management pane is visible by default", async ({ page }) => {
  await expect(page.getByTestId("managementPane")).toBeVisible();
});

test("title bar inline rename", async ({ page }) => {
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
