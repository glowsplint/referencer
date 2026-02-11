import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
  // Lock so backtick doesn't go to an editor
  await page.getByTestId("lockButton").click();
});

test("backtick toggles action console", async ({ page }) => {
  await expect(page.getByTestId("actionConsole")).not.toBeVisible();

  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();
  await expect(page.getByText("Action Console")).toBeVisible();

  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).not.toBeVisible();
});

test("action console shows log entries after actions", async ({ page }) => {
  // Add a layer
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

  // Open console
  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();

  // Should show the addLayer entry
  await expect(page.getByText("[addLayer]")).toBeVisible();
  await expect(page.getByText(/Created layer/)).toBeVisible();
});

test("close button closes the console", async ({ page }) => {
  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();

  await page.getByTestId("actionConsoleClose").click();
  await expect(page.getByTestId("actionConsole")).not.toBeVisible();
});

test("undone entries appear with strikethrough", async ({ page }) => {
  // Add a layer, then undo
  await page.getByTestId("addLayerButton").click();
  await page.keyboard.press("Meta+z");

  // Open console
  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();

  // The undone entry should have line-through styling
  const entry = page.getByText(/Created layer/).locator("..");
  await expect(entry).toHaveClass(/line-through/);
});
