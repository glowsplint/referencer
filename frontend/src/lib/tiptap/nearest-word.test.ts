import { describe, it, expect } from "vitest"
import { findNearestWord, findNearestWordOnSameLine, findFirstWordOnAdjacentLine, findWordInReadingOrder } from "./nearest-word"
import type { CollectedWord } from "./word-collection"

function makeCandidate(cx: number, cy: number, text = "word"): { word: CollectedWord; cx: number; cy: number } {
  return {
    word: { editorIndex: 0, from: 0, to: text.length, text },
    cx,
    cy,
  }
}

describe("findNearestWord", () => {
  const center = { cx: 100, cy: 100 }

  it("returns the word to the right", () => {
    const candidates = [
      makeCandidate(150, 100, "right"),
      makeCandidate(200, 100, "far"),
    ]
    const result = findNearestWord(center, candidates, "ArrowRight")
    expect(result?.text).toBe("right")
  })

  it("returns the word to the left", () => {
    const candidates = [
      makeCandidate(50, 100, "left"),
      makeCandidate(10, 100, "far"),
    ]
    const result = findNearestWord(center, candidates, "ArrowLeft")
    expect(result?.text).toBe("left")
  })

  it("returns the word above", () => {
    const candidates = [
      makeCandidate(100, 50, "above"),
      makeCandidate(100, 10, "far"),
    ]
    const result = findNearestWord(center, candidates, "ArrowUp")
    expect(result?.text).toBe("above")
  })

  it("returns the word below", () => {
    const candidates = [
      makeCandidate(100, 150, "below"),
      makeCandidate(100, 200, "far"),
    ]
    const result = findNearestWord(center, candidates, "ArrowDown")
    expect(result?.text).toBe("below")
  })

  it("returns null when no candidates in direction", () => {
    const candidates = [makeCandidate(50, 100, "left")]
    expect(findNearestWord(center, candidates, "ArrowRight")).toBeNull()
  })

  it("prefers same line for left/right (perpendicular penalty)", () => {
    const candidates = [
      makeCandidate(120, 100, "sameLine"),   // same y, close x
      makeCandidate(110, 150, "diffLine"),   // closer x but different y
    ]
    const result = findNearestWord(center, candidates, "ArrowRight")
    // sameLine: primary=20, perp=0, score=20
    // diffLine: primary=10, perp=50, score=110
    expect(result?.text).toBe("sameLine")
  })

  it("prefers same column for up/down (perpendicular penalty)", () => {
    const candidates = [
      makeCandidate(100, 50, "sameCol"),   // same x, close y
      makeCandidate(150, 80, "diffCol"),   // closer y but different x
    ]
    const result = findNearestWord(center, candidates, "ArrowUp")
    // sameCol: primary=50, perp=0, score=50
    // diffCol: primary=20, perp=50, score=120
    expect(result?.text).toBe("sameCol")
  })

  it("returns null for empty candidates", () => {
    expect(findNearestWord(center, [], "ArrowRight")).toBeNull()
  })
})

function makeCandidateAt(cx: number, cy: number, text: string, editorIndex = 0) {
  return {
    word: { editorIndex, from: 0, to: text.length, text },
    cx,
    cy,
  }
}

describe("findNearestWordOnSameLine", () => {
  const center = { cx: 500, cy: 100 }

  it("picks nearest word to the right on same line", () => {
    const candidates = [
      makeCandidateAt(600, 100, "near", 1),
      makeCandidateAt(800, 100, "far", 1),
    ]
    const result = findNearestWordOnSameLine(center, candidates, "ArrowRight")
    expect(result?.text).toBe("near")
  })

  it("picks nearest word to the left on same line", () => {
    const candidates = [
      makeCandidateAt(400, 100, "near", 0),
      makeCandidateAt(200, 100, "far", 0),
    ]
    const result = findNearestWordOnSameLine(center, candidates, "ArrowLeft")
    expect(result?.text).toBe("near")
  })

  it("ignores words on different lines", () => {
    const candidates = [
      makeCandidateAt(550, 130, "nextLine"),  // different y, beyond tolerance
      makeCandidateAt(700, 100, "sameLine", 1),
    ]
    const result = findNearestWordOnSameLine(center, candidates, "ArrowRight")
    expect(result?.text).toBe("sameLine")
  })

  it("prefers cross-editor same-line word over same-editor next-line word", () => {
    // This is the key scenario: "under" at right edge of E1
    // "MIT" is next line in E1, "Getting" is same line in E2
    const candidates = [
      makeCandidateAt(100, 125, "MIT", 0),       // next line, same editor
      makeCandidateAt(700, 100, "Getting", 1),    // same line, different editor
    ]
    const result = findNearestWordOnSameLine(center, candidates, "ArrowRight")
    expect(result?.text).toBe("Getting")
    expect(result?.editorIndex).toBe(1)
  })

  it("returns null when no words in direction on same line", () => {
    const candidates = [
      makeCandidateAt(300, 100, "left"),   // wrong direction
      makeCandidateAt(600, 150, "below"),  // different line
    ]
    const result = findNearestWordOnSameLine(center, candidates, "ArrowRight")
    expect(result).toBeNull()
  })

  it("returns null for empty candidates", () => {
    expect(findNearestWordOnSameLine(center, [], "ArrowRight")).toBeNull()
  })
})

describe("findFirstWordOnAdjacentLine", () => {
  const center = { cx: 500, cy: 100 }

  it("ArrowRight wraps to leftmost word on next visual row", () => {
    const candidates = [
      makeCandidateAt(900, 100, "sameRow", 2),   // same line, filtered out
      makeCandidateAt(100, 130, "leftE1", 0),     // next row, leftmost
      makeCandidateAt(500, 130, "midE2", 1),      // next row, middle
      makeCandidateAt(900, 130, "rightE3", 2),    // next row, rightmost
    ]
    const result = findFirstWordOnAdjacentLine(center, candidates, "ArrowRight")
    expect(result?.text).toBe("leftE1")
  })

  it("ArrowLeft wraps to rightmost word on previous visual row", () => {
    const center2 = { cx: 100, cy: 130 }
    const candidates = [
      makeCandidateAt(100, 100, "leftE1", 0),
      makeCandidateAt(500, 100, "midE2", 1),
      makeCandidateAt(900, 100, "rightE3", 2),
      makeCandidateAt(50, 130, "sameRow", 0),     // same line, filtered out
    ]
    const result = findFirstWordOnAdjacentLine(center2, candidates, "ArrowLeft")
    expect(result?.text).toBe("rightE3")
  })

  it("returns null when no rows in direction", () => {
    const candidates = [
      makeCandidateAt(200, 100, "sameLine"),
    ]
    expect(findFirstWordOnAdjacentLine(center, candidates, "ArrowRight")).toBeNull()
  })

  it("picks correct row when multiple rows below", () => {
    const candidates = [
      makeCandidateAt(100, 200, "row3"),  // farther row
      makeCandidateAt(100, 130, "row2"),  // nearest row
    ]
    const result = findFirstWordOnAdjacentLine(center, candidates, "ArrowRight")
    expect(result?.text).toBe("row2")
  })
})

function makeWord(editorIndex: number, from: number, to: number, text: string): CollectedWord {
  return { editorIndex, from, to, text }
}

describe("findWordInReadingOrder", () => {
  const words: CollectedWord[] = [
    makeWord(0, 1, 5, "hello"),
    makeWord(0, 6, 11, "world"),
    makeWord(0, 12, 16, "from"),
    makeWord(1, 1, 8, "another"),
    makeWord(1, 9, 15, "editor"),
  ]

  it("ArrowRight moves to the next word in same editor", () => {
    const result = findWordInReadingOrder(words[0], words, "ArrowRight")
    expect(result?.text).toBe("world")
  })

  it("ArrowLeft moves to the previous word in same editor", () => {
    const result = findWordInReadingOrder(words[1], words, "ArrowLeft")
    expect(result?.text).toBe("hello")
  })

  it("ArrowRight crosses from editor 0 to editor 1", () => {
    const result = findWordInReadingOrder(words[2], words, "ArrowRight")
    expect(result?.text).toBe("another")
    expect(result?.editorIndex).toBe(1)
  })

  it("ArrowLeft crosses from editor 1 to editor 0", () => {
    const result = findWordInReadingOrder(words[3], words, "ArrowLeft")
    expect(result?.text).toBe("from")
    expect(result?.editorIndex).toBe(0)
  })

  it("ArrowRight at the last word returns null", () => {
    const result = findWordInReadingOrder(words[4], words, "ArrowRight")
    expect(result).toBeNull()
  })

  it("ArrowLeft at the first word returns null", () => {
    const result = findWordInReadingOrder(words[0], words, "ArrowLeft")
    expect(result).toBeNull()
  })

  it("returns null when current word is not found", () => {
    const unknown = makeWord(2, 1, 5, "ghost")
    expect(findWordInReadingOrder(unknown, words, "ArrowRight")).toBeNull()
  })

  it("sorts words correctly when provided out of order", () => {
    const shuffled = [words[3], words[0], words[4], words[2], words[1]]
    const result = findWordInReadingOrder(words[2], shuffled, "ArrowRight")
    expect(result?.text).toBe("another")
    expect(result?.editorIndex).toBe(1)
  })
})
