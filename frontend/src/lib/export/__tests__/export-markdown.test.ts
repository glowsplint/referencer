// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import type { Editor } from "@tiptap/react";
import {
  generateDocumentMarkdown,
  layerNameToTag,
  formatIsoDate,
  buildAlignedTable,
  type ExportMarkdownOptions,
} from "../export-markdown";
import type { Layer } from "@/types/editor";

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "l1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

function makeMockEditor(text: string): Editor {
  return {
    getMarkdown: () => text,
    getText: () => text,
  } as unknown as Editor;
}

function makeOptions(overrides: Partial<ExportMarkdownOptions> = {}): ExportMarkdownOptions {
  return {
    editors: new Map([[0, makeMockEditor("Hello world")]]),
    layers: [],
    sectionNames: ["Text 1"],
    sectionVisibility: [true],
    title: "My Study",
    exportDate: new Date("2026-03-08"),
    ...overrides,
  };
}

describe("layerNameToTag", () => {
  it("converts spaces to hyphens", () => {
    expect(layerNameToTag("Key Themes")).toBe("#Key-Themes");
  });

  it("strips non-alphanumeric characters except hyphens and underscores", () => {
    expect(layerNameToTag("Layer #1!")).toBe("#Layer-1");
  });

  it("handles single-word names", () => {
    expect(layerNameToTag("Promises")).toBe("#Promises");
  });

  it("preserves underscores", () => {
    expect(layerNameToTag("my_layer")).toBe("#my_layer");
  });
});

describe("formatIsoDate", () => {
  it("formats date as YYYY-MM-DD", () => {
    expect(formatIsoDate(new Date("2026-03-08"))).toBe("2026-03-08");
  });

  it("pads single-digit months and days", () => {
    expect(formatIsoDate(new Date("2026-01-05"))).toBe("2026-01-05");
  });
});

describe("buildAlignedTable", () => {
  it("creates a pipe-aligned markdown table", () => {
    const result = buildAlignedTable(
      ["From", "To", "Style"],
      [
        ['"hello" (Gen)', '"world" (Exo)', "solid"],
        ['"a" (Rom)', '"b" (Rev)', "dashed"],
      ],
    );
    const lines = result.split("\n");
    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatch(/^\| From\s+\| To\s+\| Style\s+\|$/);
    expect(lines[1]).toMatch(/^\|[-]+\|[-]+\|[-]+\|$/);
    expect(lines[2]).toContain('"hello" (Gen)');
    expect(lines[3]).toContain("dashed");
  });

  it("pads columns to equal width", () => {
    const result = buildAlignedTable(
      ["A", "B"],
      [
        ["short", "x"],
        ["a very long cell", "y"],
      ],
    );
    const lines = result.split("\n");
    // All pipe-delimited columns should align
    const pipePositions = (line: string) =>
      [...line].reduce<number[]>((acc, c, i) => (c === "|" ? [...acc, i] : acc), []);
    expect(pipePositions(lines[0])).toEqual(pipePositions(lines[2]));
    expect(pipePositions(lines[0])).toEqual(pipePositions(lines[3]));
  });
});

describe("generateDocumentMarkdown", () => {
  it("generates YAML frontmatter with title and date", () => {
    const result = generateDocumentMarkdown(makeOptions());
    expect(result).toMatch(/^---\n/);
    expect(result).toContain("title: My Study");
    expect(result).toContain("exported: 2026-03-08");
    expect(result).toContain("---");
  });

  it("includes visible layer names in frontmatter", () => {
    const result = generateDocumentMarkdown(
      makeOptions({
        layers: [
          makeLayer({ id: "l1", name: "Promises", visible: true }),
          makeLayer({ id: "l2", name: "Key Themes", visible: true }),
          makeLayer({ id: "l3", name: "Hidden", visible: false }),
        ],
      }),
    );
    expect(result).toContain("layers:");
    expect(result).toContain("  - Promises");
    expect(result).toContain("  - Key Themes");
    expect(result).not.toContain("  - Hidden");
  });

  it("omits layers key in frontmatter when no visible layers", () => {
    const result = generateDocumentMarkdown(makeOptions({ layers: [] }));
    expect(result).not.toContain("layers:");
  });

  it("quotes title with YAML special characters in frontmatter", () => {
    const result = generateDocumentMarkdown(makeOptions({ title: "Study: Romans #8" }));
    expect(result).toContain('title: "Study: Romans #8"');
  });

  it("generates a title heading", () => {
    const result = generateDocumentMarkdown(makeOptions());
    expect(result).toContain("# My Study");
  });

  it("generates section headings for visible editors", () => {
    const result = generateDocumentMarkdown(makeOptions());
    expect(result).toContain("## Text 1");
  });

  it("includes editor content as markdown", () => {
    const result = generateDocumentMarkdown(makeOptions());
    expect(result).toContain("Hello world");
  });

  it("skips hidden sections", () => {
    const result = generateDocumentMarkdown(
      makeOptions({
        editors: new Map([
          [0, makeMockEditor("Visible")],
          [1, makeMockEditor("Hidden")],
        ]),
        sectionNames: ["Text 1", "Text 2"],
        sectionVisibility: [true, false],
      }),
    );
    expect(result).toContain("Visible");
    expect(result).not.toContain("## Text 2");
    expect(result).not.toContain("Hidden");
  });

  it("adds separator between visible sections", () => {
    const result = generateDocumentMarkdown(
      makeOptions({
        editors: new Map([
          [0, makeMockEditor("First")],
          [1, makeMockEditor("Second")],
        ]),
        sectionNames: ["Text 1", "Text 2"],
        sectionVisibility: [true, true],
      }),
    );
    expect(result).toContain("---");
  });

  describe("highlights", () => {
    it("includes visible highlights as blockquotes with tags", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              highlights: [
                {
                  id: "h1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "important",
                  annotation: "",
                  type: "highlight",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain("### Highlights");
      expect(result).toContain('> "important" #Layer-1');
    });

    it("excludes highlights from hidden layers", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              visible: false,
              highlights: [
                {
                  id: "h1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "hidden",
                  annotation: "",
                  type: "highlight",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).not.toContain("### Highlights");
      expect(result).not.toContain("hidden");
    });
  });

  describe("comments", () => {
    it("includes comments as blockquotes with Note line", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              highlights: [
                {
                  id: "h1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "verse text",
                  annotation: "<p>This is important</p>",
                  type: "comment",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain("### Comments");
      expect(result).toContain('> "verse text" #Layer-1');
      expect(result).toContain("Note (Layer 1): This is important");
    });

    it("strips HTML from annotation text", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              highlights: [
                {
                  id: "h1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "text",
                  annotation: "<p><strong>bold</strong> note</p>",
                  type: "comment",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain("Note (Layer 1): bold note");
      expect(result).not.toContain("<strong>");
    });

    it("includes reply threads", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              highlights: [
                {
                  id: "h1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "text",
                  annotation: "<p>main</p>",
                  type: "comment",
                  visible: true,
                  replies: [
                    {
                      id: "r1",
                      text: "I agree",
                      userName: "Alice",
                      timestamp: new Date("2024-01-15").getTime(),
                      reactions: [],
                    },
                  ],
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain("*Reply by Alice");
      expect(result).toContain("I agree");
    });
  });

  describe("underlines", () => {
    it("includes visible underlines as blockquotes with tags", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              underlines: [
                {
                  id: "u1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "underlined word",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain("### Underlines");
      expect(result).toContain('> "underlined word" #Layer-1');
    });
  });

  describe("arrows", () => {
    it("includes connections as a pipe-aligned table", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          editors: new Map([
            [0, makeMockEditor("Source")],
            [1, makeMockEditor("Target")],
          ]),
          sectionNames: ["Genesis", "Exodus"],
          sectionVisibility: [true, true],
          layers: [
            makeLayer({
              arrows: [
                {
                  id: "a1",
                  from: { editorIndex: 0, from: 0, to: 5, text: "source" },
                  to: { editorIndex: 1, from: 0, to: 5, text: "target" },
                  arrowStyle: "dashed",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain("## Connections");
      expect(result).toContain("| From");
      expect(result).toContain("| To");
      expect(result).toContain("| Style");
      expect(result).toContain('"source" (Genesis)');
      expect(result).toContain('"target" (Exodus)');
      expect(result).toContain("dashed");
    });

    it("excludes arrows when either section is hidden", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          sectionNames: ["Text 1", "Text 2"],
          sectionVisibility: [true, false],
          layers: [
            makeLayer({
              arrows: [
                {
                  id: "a1",
                  from: { editorIndex: 0, from: 0, to: 5, text: "from" },
                  to: { editorIndex: 1, from: 0, to: 5, text: "to" },
                  arrowStyle: "solid",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).not.toContain("## Connections");
    });
  });

  describe("empty annotations", () => {
    it("does not include empty annotation headers", () => {
      const result = generateDocumentMarkdown(makeOptions({ layers: [] }));
      expect(result).not.toContain("### Highlights");
      expect(result).not.toContain("### Comments");
      expect(result).not.toContain("### Underlines");
      expect(result).not.toContain("## Connections");
    });
  });

  describe("edge cases", () => {
    it("handles empty layers array", () => {
      const result = generateDocumentMarkdown(makeOptions({ layers: [] }));
      expect(result).toMatch(/^---\n/);
      expect(result).toContain("title: My Study");
      expect(result).not.toContain("layers:");
    });

    it("handles title with colon", () => {
      const result = generateDocumentMarkdown(makeOptions({ title: "Romans: Chapter 8" }));
      expect(result).toContain('title: "Romans: Chapter 8"');
      expect(result).toContain("# Romans: Chapter 8");
    });

    it("handles title with hash", () => {
      const result = generateDocumentMarkdown(makeOptions({ title: "Study #5" }));
      expect(result).toContain('title: "Study #5"');
    });

    it("uses blockquote format for highlights with multi-word layer names", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              name: "Key Themes",
              highlights: [
                {
                  id: "h1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "predestined",
                  annotation: "",
                  type: "highlight",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain('> "predestined" #Key-Themes');
    });

    it("handles comment with no annotation text", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          layers: [
            makeLayer({
              highlights: [
                {
                  id: "h1",
                  editorIndex: 0,
                  from: 0,
                  to: 5,
                  text: "text",
                  annotation: "",
                  type: "comment",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      expect(result).toContain('> "text" #Layer-1');
      expect(result).not.toContain("Note (");
    });

    it("defaults exportDate to current date when not provided", () => {
      const result = generateDocumentMarkdown(makeOptions({ exportDate: undefined }));
      // Should contain a valid date in YYYY-MM-DD format
      expect(result).toMatch(/exported: \d{4}-\d{2}-\d{2}/);
    });

    it("connection table aligns columns for multiple arrows", () => {
      const result = generateDocumentMarkdown(
        makeOptions({
          editors: new Map([
            [0, makeMockEditor("A")],
            [1, makeMockEditor("B")],
          ]),
          sectionNames: ["Genesis", "Exodus"],
          sectionVisibility: [true, true],
          layers: [
            makeLayer({
              arrows: [
                {
                  id: "a1",
                  from: { editorIndex: 0, from: 0, to: 5, text: "short" },
                  to: { editorIndex: 1, from: 0, to: 5, text: "t" },
                  arrowStyle: "solid",
                  visible: true,
                },
                {
                  id: "a2",
                  from: { editorIndex: 0, from: 0, to: 20, text: "a much longer source text" },
                  to: { editorIndex: 1, from: 0, to: 10, text: "target text" },
                  arrowStyle: "dashed",
                  visible: true,
                },
              ],
            }),
          ],
        }),
      );
      const lines = result.split("\n");
      const tableLines = lines.filter((l) => l.startsWith("|"));
      expect(tableLines).toHaveLength(4); // header + separator + 2 rows
      // Verify column alignment by checking pipe positions
      const pipePositions = (line: string) =>
        [...line].reduce<number[]>((acc, c, i) => (c === "|" ? [...acc, i] : acc), []);
      const positions = tableLines.map(pipePositions);
      // All rows should have same pipe positions (except separator which uses dashes)
      expect(positions[0]).toEqual(positions[2]);
      expect(positions[0]).toEqual(positions[3]);
    });
  });
});
