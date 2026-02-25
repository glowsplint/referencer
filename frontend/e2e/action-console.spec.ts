import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("managementPane")).toBeVisible();
  // Editor starts locked by default — no need to click lockButton
});

test.describe("action console", () => {

test("when backtick is pressed, then action console toggles visibility", async ({ page }) => {
  await expect(page.getByTestId("actionConsole")).not.toBeVisible();

  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();
  await expect(page.getByText("Action Console")).toBeVisible();

  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).not.toBeVisible();
});

test("when an action is performed and console is opened, then log entries with details are shown", async ({ page }) => {
  // Add a layer (appended after 3 default layers)
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-3")).toHaveText("Layer 1");

  // Open console
  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();

  // Should show the addLayer entry
  await expect(page.getByText("[addLayer]")).toBeVisible();
  await expect(page.getByText(/Created layer/)).toBeVisible();

  // Should show details for the addLayer action
  const details = page.getByTestId("actionDetail");
  await expect(details.first()).toBeVisible();
  // name and color details
  await expect(details).toHaveCount(2);
});

test("when close button is clicked, then console is dismissed", async ({ page }) => {
  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();

  await page.getByTestId("actionConsoleClose").click();
  await expect(page.getByTestId("actionConsole")).not.toBeVisible();
});

test("when an action is undone, then its console entry appears with strikethrough", async ({ page }) => {
  // Add a layer, then undo
  await page.getByTestId("addLayerButton").click();
  await page.keyboard.press("Meta+z");

  // Open console
  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible();

  // The undone entry should have line-through styling
  // description → inner flex row → outer wrapper with line-through
  const entry = page.getByText(/Created layer/).locator("../..");
  await expect(entry).toHaveClass(/line-through/);
});

}); // end action console describe
