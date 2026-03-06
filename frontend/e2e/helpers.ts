import { expect, type Page } from "@playwright/test";
import { randomUUID } from "crypto";

/**
 * Navigate to a fresh document with demo content loaded.
 * Creates a unique document per call to avoid state leaking between tests.
 */
export async function setupDocument(page: Page) {
  const documentId = randomUUID();

  // Suppress the guided tour overlay that auto-starts for first-time users
  await page.addInitScript(() => {
    localStorage.setItem("referencer-tour-editor", "completed");
  });

  await page.goto(`/#/${documentId}`);

  // Wait for the editor to mount (empty state)
  await expect(page.getByTestId("buttonPane")).toBeVisible({ timeout: 10000 });

  // Open action console (backtick key) to access demo load button
  await page.keyboard.press("`");
  await expect(page.getByTestId("actionConsole")).toBeVisible({ timeout: 5000 });

  // Click "Load Demo" and confirm the dialog
  await page.getByTestId("loadDemoButton").click();
  await expect(page.getByTestId("demoConfirmDialog")).toBeVisible({ timeout: 5000 });
  await page.getByTestId("demoConfirmLoad").click();

  // Wait for the demo content to finish loading (editor paragraphs with text render)
  await expect(page.locator(".simple-editor p").first()).toBeVisible({ timeout: 15000 });

  // Wait for demo loading overlay to disappear
  await expect(page.getByTestId("demoLoadingOverlay")).toHaveCount(0, { timeout: 15000 });

  // Wait for layers to be seeded (management pane shows layer rows)
  await expect(page.getByTestId("layerVisibility-0")).toBeVisible({ timeout: 15000 });
}
