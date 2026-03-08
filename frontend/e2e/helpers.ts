import { expect, type Page } from "@playwright/test";
import { randomUUID } from "crypto";

/**
 * Unlock the given editor pane, type text into it, then re-lock.
 */
async function typeInEditor(page: Page, editorIndex: number, text: string) {
  const wrapper = page.locator(".simple-editor-wrapper").nth(editorIndex);

  // Focus the wrapper so the lock button targets this pane
  await wrapper.evaluate((el) => {
    el.setAttribute("tabindex", "-1");
    el.focus();
  });
  await page.waitForTimeout(100);

  // Unlock the focused pane
  await page.getByTestId("lockButton").click();
  const pm = wrapper.locator(".ProseMirror");
  await expect(pm).toHaveAttribute("contenteditable", "true", { timeout: 5000 });

  // Type content
  await pm.click();
  await page.keyboard.type(text);

  // Re-lock
  await page.getByTestId("lockButton").click();
}

/**
 * Navigate to a fresh document with two editors containing typed text.
 * Creates a unique document per call to avoid state leaking between tests.
 */
export async function setupDocument(page: Page) {
  const documentId = randomUUID();

  // Suppress the guided tour overlay that auto-starts for first-time users
  await page.addInitScript(() => {
    localStorage.setItem("referencer-tour-editor", "completed");
  });

  await page.goto(`/#/${documentId}`);

  // Wait for the editor to mount
  await expect(page.getByTestId("buttonPane")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".simple-editor-wrapper .ProseMirror").first()).toBeVisible({
    timeout: 10000,
  });

  // Type content into editor 0
  await typeInEditor(page, 0, "Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu");

  // Add a second editor via the management pane
  await page.getByTestId("addTextButton").click();
  await expect(page.locator(".simple-editor-wrapper")).toHaveCount(2);

  // Type content into editor 1
  await typeInEditor(page, 1, "Nu Xi Omicron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega");
}
