import { describe, it, expect } from "vitest";
import { getWordBoundaries } from "./word-boundaries";

function makeMockDoc(textContent: string) {
  return {
    resolve(pos: number) {
      return {
        parent: {
          isTextblock: true,
          textContent,
        },
        parentOffset: pos - 1, // block starts at 1
        start() {
          return 1;
        },
      };
    },
  };
}

function makeMockDocNonTextblock() {
  return {
    resolve() {
      return {
        parent: { isTextblock: false, textContent: "" },
        parentOffset: 0,
        start() {
          return 0;
        },
      };
    },
  };
}

describe("getWordBoundaries", () => {
  it("returns word boundaries for a position inside a word", () => {
    const doc = makeMockDoc("hello world");
    const result = getWordBoundaries(doc as any, 3); // offset 2 -> inside "hello"
    expect(result).toEqual({ from: 1, to: 6, text: "hello" });
  });

  it("returns word at start of text", () => {
    const doc = makeMockDoc("hello world");
    const result = getWordBoundaries(doc as any, 1); // offset 0 -> start of "hello"
    expect(result).toEqual({ from: 1, to: 6, text: "hello" });
  });

  it("returns second word", () => {
    const doc = makeMockDoc("hello world");
    const result = getWordBoundaries(doc as any, 8); // offset 7 -> inside "world"
    expect(result).toEqual({ from: 7, to: 12, text: "world" });
  });

  it("returns null for non-textblock parent", () => {
    const doc = makeMockDocNonTextblock();
    expect(getWordBoundaries(doc as any, 1)).toBeNull();
  });

  it("returns adjacent word when position is at a space boundary", () => {
    const doc = makeMockDoc("hello world");
    // offset 5 is the space — backward walk finds "hello"
    const result = getWordBoundaries(doc as any, 6);
    expect(result).toEqual({ from: 1, to: 6, text: "hello" });
  });

  it("includes apostrophes in word boundaries", () => {
    const doc = makeMockDoc("don't stop");
    const result = getWordBoundaries(doc as any, 3); // inside "don't"
    expect(result).toEqual({ from: 1, to: 6, text: "don't" });
  });

  it("includes hyphens in word boundaries", () => {
    const doc = makeMockDoc("well-known");
    const result = getWordBoundaries(doc as any, 4); // inside "well-known"
    expect(result).toEqual({ from: 1, to: 11, text: "well-known" });
  });

  it("returns null for empty text content", () => {
    const doc = {
      resolve() {
        return {
          parent: { isTextblock: true, textContent: "" },
          parentOffset: 0,
          start() {
            return 0;
          },
        };
      },
    };
    expect(getWordBoundaries(doc as any, 0)).toBeNull();
  });
});
