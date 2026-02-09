import { describe, it, expect } from "vitest"
import { findNearestWord } from "./nearest-word"
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
