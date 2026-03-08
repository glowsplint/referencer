import type { Editor } from "@tiptap/core";
import type { Arrow, Highlight, Layer, LayerUnderline } from "@/types/editor";
import { downloadFile } from "./download";

export interface ExportMarkdownOptions {
  editors: Map<number, Editor>;
  layers: Layer[];
  sectionNames: string[];
  sectionVisibility: boolean[];
  title: string;
  exportDate?: Date;
}

function htmlToPlainText(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent ?? "";
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export function layerNameToTag(name: string): string {
  const hyphenated = name.replace(/\s+/g, "-");
  const stripped = hyphenated.replace(/[^a-zA-Z0-9\-_]/g, "");
  return `#${stripped}`;
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildAlignedTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const cellWidths = rows.map((r) => (r[i] ?? "").length);
    return Math.max(h.length, ...cellWidths);
  });

  const headerLine = `| ${headers.map((h, i) => h.padEnd(colWidths[i])).join(" | ")} |`;
  const separatorLine = `|${colWidths.map((w) => "-".repeat(w + 2)).join("|")}|`;
  const bodyLines = rows.map(
    (row) => `| ${row.map((cell, i) => (cell ?? "").padEnd(colWidths[i])).join(" | ")} |`,
  );

  return [headerLine, separatorLine, ...bodyLines].join("\n");
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

function getVisibleLayerNames(layers: Layer[]): string[] {
  const names: string[] = [];
  for (const layer of layers) {
    if (layer.visible) {
      names.push(layer.name);
    }
  }
  return names;
}

function yamlQuoteTitle(title: string): string {
  if (/[:#]/.test(title)) {
    const escaped = title.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return title;
}

function buildFrontmatter(title: string, exportDate: Date, layers: Layer[]): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`title: ${yamlQuoteTitle(title)}`);
  lines.push(`exported: ${formatIsoDate(exportDate)}`);

  const visibleNames = getVisibleLayerNames(layers);
  if (visibleNames.length > 0) {
    lines.push("layers:");
    for (const name of visibleNames) {
      lines.push(`  - ${name}`);
    }
  }

  lines.push("---");
  return lines.join("\n");
}

export function generateDocumentMarkdown(options: ExportMarkdownOptions): string {
  const { editors, layers, sectionNames, sectionVisibility, title } = options;
  const exportDate = options.exportDate ?? new Date();
  const parts: string[] = [];

  parts.push(buildFrontmatter(title, exportDate, layers));
  parts.push("");
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
        const tag = layerNameToTag(layerName);
        parts.push(`\n> "${highlight.text}" ${tag}`);
      }
      parts.push("");
    }

    // Comments
    const comments = getVisibleHighlights(layers, i, "comment");
    if (comments.length > 0) {
      parts.push(`\n### Comments\n`);
      for (const { highlight, layerName } of comments) {
        const tag = layerNameToTag(layerName);
        const plainAnnotation = htmlToPlainText(highlight.annotation);
        parts.push(`\n> "${highlight.text}" ${tag}`);
        if (plainAnnotation) {
          parts.push("");
          parts.push(`Note (${layerName}): ${plainAnnotation}`);
        }
        if (highlight.replies && highlight.replies.length > 0) {
          parts.push("");
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
        const tag = layerNameToTag(layerName);
        parts.push(`\n> "${underline.text}" ${tag}`);
      }
      parts.push("");
    }

    textCount++;
  }

  // Arrows / Connections
  const arrows = getVisibleArrows(layers, sectionVisibility);
  if (arrows.length > 0) {
    parts.push(`\n## Connections\n`);
    const headers = ["From", "To", "Style"];
    const rows = arrows.map(({ arrow }) => {
      const fromSection =
        sectionNames[arrow.from.editorIndex] ?? `Text ${arrow.from.editorIndex + 1}`;
      const toSection = sectionNames[arrow.to.editorIndex] ?? `Text ${arrow.to.editorIndex + 1}`;
      return [
        `"${arrow.from.text}" (${fromSection})`,
        `"${arrow.to.text}" (${toSection})`,
        arrow.arrowStyle ?? "solid",
      ];
    });
    parts.push(buildAlignedTable(headers, rows));
    parts.push("");
  }

  return parts.join("\n");
}

export function exportDocumentAsMarkdown(options: ExportMarkdownOptions): void {
  const markdown = generateDocumentMarkdown(options);
  downloadFile(markdown, `${options.title}.md`, "text/markdown");
}
