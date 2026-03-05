// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { generateWorkspaceMarkdown, type ExportMarkdownOptions } from "../export-markdown";
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

function makeMockEditor(text: string) {
  return {
    getMarkdown: () => text,
    getText: () => text,
  } as any;
}

function makeOptions(overrides: Partial<ExportMarkdownOptions> = {}): ExportMarkdownOptions {
  return {
    editors: new Map([[0, makeMockEditor("Hello world")]]),
    layers: [],
    sectionNames: ["Text 1"],
    sectionVisibility: [true],
    title: "My Study",
    ...overrides,
  };
}

describe("generateWorkspaceMarkdown", () => {
  it("generates a title heading", () => {
    const result = generateWorkspaceMarkdown(makeOptions());
    expect(result).toContain("# My Study");
  });

  it("generates section headings for visible editors", () => {
    const result = generateWorkspaceMarkdown(makeOptions());
    expect(result).toContain("## Text 1");
  });

  it("includes editor content as markdown", () => {
    const result = generateWorkspaceMarkdown(makeOptions());
    expect(result).toContain("Hello world");
  });

  it("skips hidden sections", () => {
    const result = generateWorkspaceMarkdown(
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
    const result = generateWorkspaceMarkdown(
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
    it("includes visible highlights", () => {
      const result = generateWorkspaceMarkdown(
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
      expect(result).toContain('"important" -- Layer: Layer 1');
    });

    it("excludes highlights from hidden layers", () => {
      const result = generateWorkspaceMarkdown(
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
    it("includes comments with plain-text annotation", () => {
      const result = generateWorkspaceMarkdown(
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
      expect(result).toContain('"verse text" -- Layer: Layer 1');
      expect(result).toContain("> This is important");
    });

    it("strips HTML from annotation text", () => {
      const result = generateWorkspaceMarkdown(
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
      expect(result).toContain("> bold note");
      expect(result).not.toContain("<strong>");
    });

    it("includes reply threads", () => {
      const result = generateWorkspaceMarkdown(
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
    it("includes visible underlines", () => {
      const result = generateWorkspaceMarkdown(
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
      expect(result).toContain('"underlined word" -- Layer: Layer 1');
    });
  });

  describe("arrows", () => {
    it("includes connections section with arrows", () => {
      const result = generateWorkspaceMarkdown(
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
      expect(result).toContain('"source" (Genesis) -> "target" (Exodus) [dashed]');
    });

    it("excludes arrows when either section is hidden", () => {
      const result = generateWorkspaceMarkdown(
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
      const result = generateWorkspaceMarkdown(makeOptions({ layers: [] }));
      expect(result).not.toContain("### Highlights");
      expect(result).not.toContain("### Comments");
      expect(result).not.toContain("### Underlines");
      expect(result).not.toContain("## Connections");
    });
  });
});
