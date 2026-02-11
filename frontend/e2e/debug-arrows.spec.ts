import { test, expect } from "@playwright/test";

test("debug arrow endpoint highlights", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".simple-editor p").first()).toBeVisible();

  // Create a layer
  await page.getByTestId("addLayerButton").click();
  await expect(page.getByTestId("layerName-0")).toHaveText("Layer 1");

  // Lock
  await page.getByTestId("lockButton").click();
  await expect(page.getByTestId("editorToolbar")).toHaveCount(0);

  // Click a word
  const firstParagraph = page.locator(".simple-editor p").first();
  const box = await firstParagraph.boundingBox();
  await page.mouse.click(box!.x + 30, box!.y + box!.height / 2);
  await expect(page.locator(".word-selection")).toBeVisible({ timeout: 2000 });

  // Dismiss auto-focused annotation input so arrow keys navigate words
  await page.keyboard.press("Escape");

  // Draw an arrow
  await page.keyboard.down("a");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.up("a");

  // Wait for arrow to appear
  await expect(page.getByTestId("arrow-line")).toHaveCount(1, { timeout: 2000 });

  // Wait a bit for decorations to apply
  await page.waitForTimeout(500);

  // Take screenshot
  await page.screenshot({ path: "/tmp/debug-arrows.png", fullPage: true });

  // Inspect what spans exist in the editor
  const spanInfo = await page.evaluate(() => {
    const editors = document.querySelectorAll('.simple-editor');
    const results: string[] = [];
    editors.forEach((editor, idx) => {
      const spans = editor.querySelectorAll('span');
      spans.forEach(span => {
        if (span.getAttribute('style')) {
          results.push(`editor ${idx}: <span style="${span.getAttribute('style')}">${span.textContent}</span>`);
        }
      });
      // Also check for any inline decorations
      const allElements = editor.querySelectorAll('*[style*="background"]');
      allElements.forEach(el => {
        results.push(`editor ${idx} bg: <${el.tagName} style="${el.getAttribute('style')}">${el.textContent?.slice(0, 30)}</${el.tagName}>`);
      });
    });
    return results;
  });
  console.log("Spans with styles:", JSON.stringify(spanInfo, null, 2));

  // Check the ProseMirror plugin state
  const pluginState = await page.evaluate(() => {
    // Try to access TipTap editors from the DOM
    const editors = document.querySelectorAll('.tiptap');
    const results: string[] = [];
    editors.forEach((el, idx) => {
      // ProseMirror stores view on the DOM element
      const view = (el as any).pmViewDesc?.view || (el as any).__view;
      if (view) {
        results.push(`editor ${idx}: has ProseMirror view`);
      } else {
        results.push(`editor ${idx}: no ProseMirror view found on element`);
      }
    });
    return results;
  });
  console.log("Plugin state:", JSON.stringify(pluginState, null, 2));

  // Check all HTML in first editor
  const editorHtml = await page.locator('.simple-editor').first().innerHTML();
  console.log("First editor HTML (first 2000 chars):", editorHtml.slice(0, 2000));
});
