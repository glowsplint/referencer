import { test, expect } from "@playwright/test";

test.describe("when interacting with passage headers", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".simple-editor p").first()).toBeVisible();
  });

  test("when workspace loads, then passage header shows passage name above editor", async ({
    page,
  }) => {
    const header = page.getByTestId("passageHeader-0");
    await expect(header).toBeVisible();
    // Default name is the Bible passage reference
    await expect(header).toHaveText("1 Corinthians 1:18\u201331");
  });

  test("when passage header is double-clicked, then edit mode is entered", async ({ page }) => {
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await expect(input).toBeVisible({ timeout: 2000 });
    await expect(input).toHaveValue("1 Corinthians 1:18\u201331");
  });

  test("when passage header is renamed, then the name is updated", async ({ page }) => {
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await input.fill("My Custom Passage");
    await input.press("Enter");

    await expect(page.getByTestId("passageHeader-0")).toHaveText("My Custom Passage");
  });

  test("when passage header is renamed, then management pane reflects the change", async ({
    page,
  }) => {
    // Rename via header
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await input.fill("Renamed Passage");
    await input.press("Enter");

    // Check management pane reflects the change
    await expect(page.getByTestId("passageName-0")).toHaveText("Renamed Passage");
  });

  test("when workspace has two passages, then each has its own header", async ({ page }) => {
    // Already 2 passages by default
    await expect(page.getByTestId("passageHeader-0")).toHaveText("1 Corinthians 1:18\u201331");
    await expect(page.getByTestId("passageHeader-1")).toHaveText("1 Corinthians 2:6\u201316");
  });

  test("when third passage is added, then it gets default name", async ({ page }) => {
    await page.getByTestId("addPassageButton").click();
    await expect(page.locator(".simple-editor-wrapper")).toHaveCount(3);

    await expect(page.getByTestId("passageHeader-2")).toHaveText("Passage 3");
  });

  test("when Escape is pressed during rename, then passage header rename is cancelled", async ({
    page,
  }) => {
    const header = page.getByTestId("passageHeader-0");
    await header.dblclick();

    const input = page.getByTestId("passageHeaderInput-0");
    await input.fill("Should Not Save");
    await input.press("Escape");

    // Name should revert to original
    await expect(page.getByTestId("passageHeader-0")).toHaveText("1 Corinthians 1:18\u201331");
  });
});
