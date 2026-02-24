import { test, expect } from "@playwright/test";

// Navigate to a fresh workspace for each test.
// The app creates an ephemeral workspace when visiting /#/<uuid>.
function freshWorkspaceUrl(): string {
  const uuid = crypto.randomUUID();
  return `/#/${uuid}`;
}

test.describe("Tour feature", () => {
  test("tour auto-starts on first visit", async ({ page }) => {
    await page.goto(freshWorkspaceUrl());
    // Wait for the tour overlay (auto-starts with 500ms delay)
    await expect(page.getByTestId("tourOverlay")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("tourTooltip")).toBeVisible();
  });

  test("tour overlay and tooltip show correct first step", async ({ page }) => {
    await page.goto(freshWorkspaceUrl());
    await expect(page.getByTestId("tourTooltip")).toBeVisible({ timeout: 10000 });
    // First step title
    await expect(page.getByText("Paste your text")).toBeVisible();
  });

  test("step navigation: Next advances, Back goes back", async ({ page }) => {
    await page.goto(freshWorkspaceUrl());
    await expect(page.getByTestId("tourTooltip")).toBeVisible({ timeout: 10000 });

    // First step
    await expect(page.getByText("Paste your text")).toBeVisible();

    // Click Next to go to step 2
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Lock the document")).toBeVisible();

    // Click Back to return to step 1
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText("Paste your text")).toBeVisible();
  });

  test("skip dismisses tour", async ({ page }) => {
    await page.goto(freshWorkspaceUrl());
    await expect(page.getByTestId("tourTooltip")).toBeVisible({ timeout: 10000 });

    // Click Skip
    await page.getByRole("button", { name: "Skip" }).click();

    // Tour overlay should be gone
    await expect(page.getByTestId("tourOverlay")).not.toBeVisible();
  });

  test("tour does not show again after completion", async ({ page }) => {
    const url = freshWorkspaceUrl();
    await page.goto(url);
    await expect(page.getByTestId("tourTooltip")).toBeVisible({ timeout: 10000 });

    // Skip to complete the tour
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByTestId("tourOverlay")).not.toBeVisible();

    // Reload the page -- tour should not reappear
    await page.reload();
    await page.waitForLoadState("networkidle");
    // Give it enough time to auto-start if it were going to
    await page.waitForTimeout(1500);
    await expect(page.getByTestId("tourOverlay")).not.toBeVisible();
  });

  test("tour re-triggerable from ButtonPane help icon", async ({ page }) => {
    await page.goto(freshWorkspaceUrl());
    await expect(page.getByTestId("tourTooltip")).toBeVisible({ timeout: 10000 });

    // Skip the tour first
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page.getByTestId("tourOverlay")).not.toBeVisible();

    // Click the tour button in ButtonPane
    await page.getByTestId("tourButton").click();

    // Tour should reappear
    await expect(page.getByTestId("tourOverlay")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("tourTooltip")).toBeVisible();
  });

  test("Back button is hidden on first step", async ({ page }) => {
    await page.goto(freshWorkspaceUrl());
    await expect(page.getByTestId("tourTooltip")).toBeVisible({ timeout: 10000 });
    // Back button should not exist on the first step
    await expect(page.getByRole("button", { name: "Back" })).not.toBeVisible();
  });

  test("Escape key dismisses tour", async ({ page }) => {
    await page.goto(freshWorkspaceUrl());
    await expect(page.getByTestId("tourTooltip")).toBeVisible({ timeout: 10000 });

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("tourOverlay")).not.toBeVisible();
  });
});
