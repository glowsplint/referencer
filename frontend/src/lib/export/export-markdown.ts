import type { Editor } from "@tiptap/core";
import type { Arrow, Highlight, Layer, LayerUnderline } from "@/types/editor";
import { downloadFile } from "./download";

export interface ExportMarkdownOptions {
  editors: Map<number, Editor>;
  layers: Layer[];
  sectionNames: string[];
  sectionVisibility: boolean[];
  title: string;
}

function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

function getVisibleHighlights(
  layers: Layer[],
  editorIndex: number,
  type: "highlight" | "comment",
): { highlight: Highlight; layerName: string }[] {
  const results: { highlight: Highlight; layerName: string }[] = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const h of layer.highlights) {
      if (h.editorIndex === editorIndex && h.type === type) {
        results.push({ highlight: h, layerName: layer.name });
      }
    }
  }
  return results;
}

function getVisibleUnderlines(
  layers: Layer[],
  editorIndex: number,
): { underline: LayerUnderline; layerName: string }[] {
  const results: { underline: LayerUnderline; layerName: string }[] = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const u of layer.underlines) {
      if (u.editorIndex === editorIndex) {
        results.push({ underline: u, layerName: layer.name });
      }
    }
  }
  return results;
}

function getVisibleArrows(
  layers: Layer[],
  sectionVisibility: boolean[],
): { arrow: Arrow; layerName: string }[] {
  const results: { arrow: Arrow; layerName: string }[] = [];
  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const a of layer.arrows) {
      if (sectionVisibility[a.from.editorIndex] && sectionVisibility[a.to.editorIndex]) {
        results.push({ arrow: a, layerName: layer.name });
      }
    }
  }
  return results;
}

export function generateWorkspaceMarkdown(options: ExportMarkdownOptions): string {
  const { editors, layers, sectionNames, sectionVisibility, title } = options;
  const parts: string[] = [];

  parts.push(`# ${title}\n`);

  let textCount = 0;

  for (let i = 0; i < sectionNames.length; i++) {
    if (!sectionVisibility[i]) continue;

    if (textCount > 0) {
      parts.push("\n---\n");
    }

    parts.push(`\n## ${sectionNames[i]}\n`);

    const editor = editors.get(i);
    if (editor) {
      try {
        const markdown = editor.getMarkdown();
        parts.push(`\n${markdown}\n`);
      } catch {
        parts.push(`\n${editor.getText()}\n`);
      }
    }

    // Highlights
    const highlights = getVisibleHighlights(layers, i, "highlight");
    if (highlights.length > 0) {
      parts.push(`\n### Highlights\n`);
      for (const { highlight, layerName } of highlights) {
        parts.push(`\n- "${highlight.text}" -- Layer: ${layerName}`);
      }
      parts.push("");
    }

    // Comments
    const comments = getVisibleHighlights(layers, i, "comment");
    if (comments.length > 0) {
      parts.push(`\n### Comments\n`);
      for (const { highlight, layerName } of comments) {
        const plainAnnotation = htmlToPlainText(highlight.annotation);
        parts.push(`\n- "${highlight.text}" -- Layer: ${layerName}`);
        if (plainAnnotation) {
          parts.push(`  > ${plainAnnotation}`);
        }
        if (highlight.replies && highlight.replies.length > 0) {
          for (const reply of highlight.replies) {
            parts.push(
              `  - *Reply by ${reply.userName} (${formatDate(reply.timestamp)}):* ${reply.text}`,
            );
          }
        }
      }
      parts.push("");
    }

    // Underlines
    const underlines = getVisibleUnderlines(layers, i);
    if (underlines.length > 0) {
      parts.push(`\n### Underlines\n`);
      for (const { underline, layerName } of underlines) {
        parts.push(`\n- "${underline.text}" -- Layer: ${layerName}`);
      }
      parts.push("");
    }

    textCount++;
  }

  // Arrows / Connections
  const arrows = getVisibleArrows(layers, sectionVisibility);
  if (arrows.length > 0) {
    parts.push(`\n## Connections\n`);
    for (const { arrow } of arrows) {
      const fromSection =
        sectionNames[arrow.from.editorIndex] ?? `Text ${arrow.from.editorIndex + 1}`;
      const toSection = sectionNames[arrow.to.editorIndex] ?? `Text ${arrow.to.editorIndex + 1}`;
      parts.push(
        `\n- "${arrow.from.text}" (${fromSection}) -> "${arrow.to.text}" (${toSection}) [${arrow.arrowStyle ?? "solid"}]`,
      );
    }
    parts.push("");
  }

  return parts.join("\n");
}

export function exportWorkspaceAsMarkdown(options: ExportMarkdownOptions): void {
  const markdown = generateWorkspaceMarkdown(options);
  downloadFile(markdown, `${options.title}.md`, "text/markdown");
}
