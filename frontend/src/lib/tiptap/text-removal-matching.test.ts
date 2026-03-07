import { describe, it, expect } from "vitest";
import {
  globToRegex,
  compilePattern,
  findFilteredMatches,
  deleteMatchRanges,
  type TextRemovalFilter,
} from "./text-removal-matching";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockDoc(nodes: Array<{ text: string; marks: string[]; pos: number }>) {
  return {
    descendants: (callback: (node: any, pos: number) => boolean | void) => {
      for (const n of nodes) {
        callback(
          {
            isText: true,
            text: n.text,
            marks: n.marks.map((name) => ({ type: { name } })),
          },
          n.pos,
        );
      }
    },
  } as any;
}

function createMockEditor() {
  const deleteCalls: Array<{ from: number; to: number }> = [];
  const mockTr = {
    delete: (from: number, to: number) => {
      deleteCalls.push({ from, to });
      return mockTr;
    },
  };
  const editor = {
    chain: () => ({
      command: (fn: (props: { tr: any }) => boolean) => {
        fn({ tr: mockTr });
        return { run: () => true };
      },
    }),
  };
  return { editor: editor as any, deleteCalls };
}

// ---------------------------------------------------------------------------
// globToRegex
// ---------------------------------------------------------------------------

describe("when using globToRegex", () => {
  it("then converts * to .*? (non-greedy, matches anything)", () => {
    const result = globToRegex("*");
    expect(result).toBe(".*?");
    expect(new RegExp(result).test("anything")).toBe(true);
  });

  it("then escapes parens and converts star for (*)", () => {
    const result = globToRegex("(*)");
    expect(result).toBe("\\(.*?\\)");

    const re = new RegExp(result);
    expect(re.test("(1)")).toBe(true);
    expect(re.test("(abc)")).toBe(true);
    expect(re.test("no parens")).toBe(false);
  });

  it("then escapes special regex chars like .", () => {
    const result = globToRegex("file.txt");
    expect(result).toBe("file\\.txt");

    const re = new RegExp(result);
    expect(re.test("file.txt")).toBe(true);
    expect(re.test("fileXtxt")).toBe(false);
  });

  it("then converts ? to . (single char)", () => {
    const result = globToRegex("a?b");
    expect(result).toBe("a.b");

    const re = new RegExp(result);
    expect(re.test("axb")).toBe(true);
    expect(re.test("ab")).toBe(false);
  });

  it("then escapes multiple special characters", () => {
    const result = globToRegex("[test]+");
    expect(result).toBe("\\[test\\]\\+");
  });
});

// ---------------------------------------------------------------------------
// compilePattern
// ---------------------------------------------------------------------------

describe("when using compilePattern", () => {
  it("then returns a RegExp for a valid regex pattern", () => {
    const re = compilePattern("\\d+", true);
    expect(re).toBeInstanceOf(RegExp);
    expect(re!.source).toBe("\\d+");
    expect(re!.flags).toBe("g");
  });

  it("then returns null for an invalid regex pattern", () => {
    const re = compilePattern("(invalid[", true);
    expect(re).toBeNull();
  });

  it("then converts glob to regex and returns RegExp", () => {
    const re = compilePattern("(*)", false);
    expect(re).toBeInstanceOf(RegExp);
    expect(re!.source).toBe("\\(.*?\\)");
    expect(re!.flags).toBe("g");
  });

  it("then compiles empty pattern in glob mode as .* to match everything", () => {
    const re = compilePattern("", false);
    expect(re).toBeInstanceOf(RegExp);
    expect(re!.source).toBe(".*");
    expect(re!.test("anything")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// findFilteredMatches
// ---------------------------------------------------------------------------

describe("when using findFilteredMatches", () => {
  it("then matches all text nodes with no marks filter and * pattern", () => {
    const doc = createMockDoc([
      { text: "hello", marks: [], pos: 1 },
      { text: "world", marks: [], pos: 7 },
    ]);
    const filter: TextRemovalFilter = { selectedMarks: [], pattern: "*", isRegex: false };
    const matches = findFilteredMatches(doc, filter);

    expect(matches).toEqual([
      { from: 1, to: 6, text: "hello" },
      { from: 7, to: 12, text: "world" },
    ]);
  });

  it("then filters by a single mark", () => {
    const doc = createMockDoc([
      { text: "bold text", marks: ["bold"], pos: 1 },
      { text: "plain text", marks: [], pos: 11 },
    ]);
    const filter: TextRemovalFilter = { selectedMarks: ["bold"], pattern: "*", isRegex: false };
    const matches = findFilteredMatches(doc, filter);

    expect(matches).toEqual([{ from: 1, to: 10, text: "bold text" }]);
  });

  it("then uses AND logic for multiple marks", () => {
    const doc = createMockDoc([
      { text: "bold italic", marks: ["bold", "italic"], pos: 1 },
      { text: "only bold", marks: ["bold"], pos: 13 },
      { text: "plain", marks: [], pos: 23 },
    ]);
    const filter: TextRemovalFilter = {
      selectedMarks: ["bold", "italic"],
      pattern: "*",
      isRegex: false,
    };
    const matches = findFilteredMatches(doc, filter);

    expect(matches).toEqual([{ from: 1, to: 12, text: "bold italic" }]);
  });

  it("then applies pattern filtering within matched text nodes", () => {
    const doc = createMockDoc([{ text: "ref (1) and (2) here", marks: [], pos: 0 }]);
    const filter: TextRemovalFilter = { selectedMarks: [], pattern: "(*)", isRegex: false };
    const matches = findFilteredMatches(doc, filter);

    expect(matches).toEqual([
      { from: 4, to: 7, text: "(1)" },
      { from: 12, to: 15, text: "(2)" },
    ]);
  });

  it("then returns empty array for empty doc", () => {
    const doc = createMockDoc([]);
    const filter: TextRemovalFilter = { selectedMarks: [], pattern: "*", isRegex: false };
    const matches = findFilteredMatches(doc, filter);

    expect(matches).toEqual([]);
  });

  it("then filters by link mark", () => {
    const doc = createMockDoc([
      { text: "click here", marks: ["link"], pos: 0 },
      { text: "plain text", marks: [], pos: 11 },
    ]);
    const filter: TextRemovalFilter = { selectedMarks: ["link"], pattern: "*", isRegex: false };
    const matches = findFilteredMatches(doc, filter);

    expect(matches).toEqual([{ from: 0, to: 10, text: "click here" }]);
  });

  it("then applies regex pattern matching", () => {
    const doc = createMockDoc([{ text: "item 42 and item 7", marks: [], pos: 0 }]);
    const filter: TextRemovalFilter = {
      selectedMarks: [],
      pattern: "\\d+",
      isRegex: true,
    };
    const matches = findFilteredMatches(doc, filter);

    expect(matches).toEqual([
      { from: 5, to: 7, text: "42" },
      { from: 17, to: 18, text: "7" },
    ]);
  });

  it("then combines mark filter with pattern matching", () => {
    const doc = createMockDoc([
      { text: "ref (1) note", marks: ["bold"], pos: 0 },
      { text: "ref (2) note", marks: [], pos: 13 },
    ]);
    const filter: TextRemovalFilter = {
      selectedMarks: ["bold"],
      pattern: "(*)",
      isRegex: false,
    };
    const matches = findFilteredMatches(doc, filter);

    // Only the bold node is checked, and only (1) matches
    expect(matches).toEqual([{ from: 4, to: 7, text: "(1)" }]);
  });
});

// ---------------------------------------------------------------------------
// deleteMatchRanges
// ---------------------------------------------------------------------------

describe("when using deleteMatchRanges", () => {
  it("then deletes in reverse position order (highest from first)", () => {
    const { editor, deleteCalls } = createMockEditor();
    const matches = [
      { from: 5, to: 8, text: "foo" },
      { from: 20, to: 25, text: "hello" },
      { from: 10, to: 13, text: "bar" },
    ];

    deleteMatchRanges(editor, matches);

    expect(deleteCalls).toEqual([
      { from: 20, to: 25 },
      { from: 10, to: 13 },
      { from: 5, to: 8 },
    ]);
  });

  it("then executes all deletes in a single transaction", () => {
    const { editor, deleteCalls } = createMockEditor();
    const matches = [
      { from: 0, to: 3, text: "abc" },
      { from: 10, to: 15, text: "defgh" },
    ];

    const result = deleteMatchRanges(editor, matches);

    expect(result).toBe(true);
    expect(deleteCalls).toHaveLength(2);
  });

  it("then handles empty matches array", () => {
    const { editor, deleteCalls } = createMockEditor();

    const result = deleteMatchRanges(editor, []);

    expect(result).toBe(true);
    expect(deleteCalls).toHaveLength(0);
  });

  it("then does not mutate the original matches array", () => {
    const { editor } = createMockEditor();
    const matches = [
      { from: 5, to: 8, text: "foo" },
      { from: 1, to: 3, text: "ab" },
    ];
    const original = [...matches];

    deleteMatchRanges(editor, matches);

    expect(matches).toEqual(original);
  });
});
