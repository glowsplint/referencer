import { describe, it, expect } from "vitest";
import { findTextMatches } from "./find-text-matches";

function mockDoc(blocks: string[]) {
  const children = blocks.map((text) => ({
    isTextblock: true,
    textContent: text,
  }));

  return {
    descendants(callback: (node: any, pos: number) => boolean | void) {
      let pos = 0;
      for (const child of children) {
        callback(child, pos);
        // pos + 1 (opening) + textContent.length + 1 (closing)
        pos += 1 + child.textContent.length + 1;
      }
    },
  } as any;
}

describe("when using findTextMatches", () => {
  it("then finds a single word match in one paragraph", () => {
    const doc = mockDoc(["hello world"]);
    const matches = findTextMatches(doc, "hello");

    expect(matches).toEqual([{ from: 1, to: 6 }]);
  });

  it("then finds multiple matches in one paragraph", () => {
    const doc = mockDoc(["the cat and the dog"]);
    const matches = findTextMatches(doc, "the");

    expect(matches).toEqual([
      { from: 1, to: 4 },
      { from: 13, to: 16 },
    ]);
  });

  it("then finds matches across multiple paragraphs", () => {
    const doc = mockDoc(["hello world", "hello again"]);
    const matches = findTextMatches(doc, "hello");

    expect(matches).toEqual([
      { from: 1, to: 6 },
      { from: 14, to: 19 },
    ]);
  });

  it("then finds multi-word phrase match", () => {
    const doc = mockDoc(["the quick brown fox"]);
    const matches = findTextMatches(doc, "quick brown");

    expect(matches).toEqual([{ from: 5, to: 16 }]);
  });

  it("then returns empty array when no match", () => {
    const doc = mockDoc(["hello world"]);
    const matches = findTextMatches(doc, "xyz");

    expect(matches).toEqual([]);
  });

  it("then returns empty array for empty search text", () => {
    const doc = mockDoc(["hello world"]);
    const matches = findTextMatches(doc, "");

    expect(matches).toEqual([]);
  });

  it("then is case-sensitive", () => {
    const doc = mockDoc(["Hello hello HELLO"]);
    const matches = findTextMatches(doc, "hello");

    expect(matches).toEqual([{ from: 7, to: 12 }]);
  });

  it("then computes correct positions across multiple textblocks", () => {
    // Block 0: pos=0, opening=1, "foo"=3, closing=1 → next pos=5
    // Block 1: pos=5, opening=1, "bar foo baz"=11, closing=1 → next pos=17
    const doc = mockDoc(["foo", "bar foo baz"]);
    const matches = findTextMatches(doc, "foo");

    expect(matches).toEqual([
      { from: 1, to: 4 }, // first block: 0 + 1 + 0 = 1
      { from: 10, to: 13 }, // second block: 5 + 1 + 4 = 10
    ]);
  });

  it("then handles non-overlapping matches correctly", () => {
    const doc = mockDoc(["aaa"]);
    const matches = findTextMatches(doc, "aa");

    // "aaa" → match at index 0 ("aa"), then advance to index 2, only "a" left → no more
    expect(matches).toEqual([{ from: 1, to: 3 }]);
  });
});
