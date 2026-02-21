import { test, expect } from "@playwright/test";

test.describe("passage header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
  });

  test("passage header shows passage name above editor", async ({ page }) => {
    const header = page.getByTestId("passageHeader-0");
    await expect(header).toBeVisible();
    // Default name is the Bible passage reference
    await expect(header).toHaveText("1 Corinthians 1:18\u201331");
  });

  test("double-clicking passage header enters edit mode", async ({ page }) => {
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await expect(input).toBeVisible({ timeout: 2000 });
    await expect(input).toHaveValue("1 Corinthians 1:18\u201331");
  });

  test("renaming passage header updates the name", async ({ page }) => {
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await input.fill("My Custom Passage");
    await input.press("Enter");

    await expect(page.getByTestId("passageHeader-0")).toHaveText("My Custom Passage");
  });

  test("passage header rename syncs with management pane", async ({ page }) => {
    // Rename via header
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await input.fill("Renamed Passage");
    await input.press("Enter");

    // Check management pane reflects the change
    await expect(page.getByTestId("passageName-0")).toHaveText("Renamed Passage");
  });

  test("second passage has its own header", async ({ page }) => {
    // Already 2 passages by default
    await expect(page.getByTestId("passageHeader-0")).toHaveText("1 Corinthians 1:18\u201331");
    await expect(page.getByTestId("passageHeader-1")).toHaveText("1 Corinthians 2:6\u201316");
  });

  test("third passage added via button gets default name", async ({ page }) => {
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

    await expect(page.getByTestId("passageHeader-2")).toHaveText("Passage 3");
  });

  test("escape key cancels passage header rename", async ({ page }) => {
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await input.fill("Should Not Save");
    await input.press("Escape");

    // Name should revert to original
    await expect(page.getByTestId("passageHeader-0")).toHaveText("1 Corinthians 1:18\u201331");
  });
});
