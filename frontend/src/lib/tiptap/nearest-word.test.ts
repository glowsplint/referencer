import { describe, it, expect, vi } from "vitest"
import { findNearestWord, findNearestWordOnSameLine, findFirstWordOnAdjacentLine, findWordInReadingOrder, getWordRect, findFirstWordOnLine, findLastWordOnLine, isAtLineStart, isAtLineEnd, getWordCenterRelativeToWrapper, getWordRectRelativeToWrapper } from "./nearest-word"
import type { CollectedWord } from "./word-collection"
import type { Editor } from "@tiptap/react"

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
    // Both on different lines from current; diffCol is on nearest line (cy=80)
    // sameCol is on a farther line (cy=50)
    // Line-first: picks nearest line (80), then closest x → diffCol
    expect(result?.text).toBe("diffCol")
  })

  it("picks horizontally closest word on the nearest line below", () => {
    const candidates = [
      makeCandidate(200, 130, "nextFar"),   // next line, far horizontally
      makeCandidate(105, 130, "nextClose"), // next line, close horizontally
      makeCandidate(100, 200, "skipLine"),  // two lines down, same column
    ]
    const result = findNearestWord(center, candidates, "ArrowDown")
    expect(result?.text).toBe("nextClose")
  })

  it("does not skip lines even when a farther line has better column alignment", () => {
    const candidates = [
      makeCandidate(50, 130, "nextLine"),  // next line, offset horizontally
      makeCandidate(100, 200, "farLine"),  // two lines down, same column
    ]
    const result = findNearestWord(center, candidates, "ArrowDown")
    expect(result?.text).toBe("nextLine")
  })

  it("returns null for empty candidates", () => {
    expect(findNearestWord(center, [], "ArrowRight")).toBeNull()
  })

  it("same-editor filtering: prefers same-editor word over closer cross-editor word", () => {
    // Simulates side-by-side editors: "and" is selected in editor 0.
    // Editor 0 has "professional" on the next line (cy=130, cx=80).
    // Editor 1 has "Integrate" at a closer Y (cy=115, cx=400).
    // When candidates are filtered to same-editor only, "professional" wins.
    const sameEditorCandidates = [
      { word: { editorIndex: 0, from: 50, to: 62, text: "professional" }, cx: 80, cy: 130 },
      { word: { editorIndex: 0, from: 70, to: 85, text: "placeholder" }, cx: 100, cy: 160 },
    ]
    const result = findNearestWord(center, sameEditorCandidates, "ArrowDown")
    expect(result?.text).toBe("professional")
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

describe("getWordRect", () => {
  function createMockEditor(coordsMap: Record<number, { left: number; right: number; top: number; bottom: number }>) {
    return {
      state: {
        doc: { nodeAt: vi.fn(() => ({ type: { name: "text" } })) },
      },
      view: {
        coordsAtPos: vi.fn((pos: number) => coordsMap[pos] ?? { left: 0, right: 0, top: 0, bottom: 0 }),
        nodeDOM: vi.fn(),
      },
    } as unknown as Editor
  }

  const containerRect = { left: 10, top: 20, width: 800, height: 600 } as DOMRect

  it("returns rect with SVG-relative coordinates", () => {
    const editor = createMockEditor({
      5: { left: 60, right: 70, top: 120, bottom: 140 },
      10: { left: 100, right: 110, top: 120, bottom: 140 },
    })
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>

    const result = getWordRect(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      containerRect
    )

    expect(result).toEqual({
      x: 50,    // 60 - 10
      y: 100,   // 120 - 20
      width: 50, // 110 - 60
      height: 20, // 140 - 120
    })
  })

  it("returns null when editor not found", () => {
    const editorsRef = { current: new Map() } as React.RefObject<Map<number, Editor>>
    const result = getWordRect(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      containerRect
    )
    expect(result).toBeNull()
  })

  it("returns null when coordsAtPos throws", () => {
    const editor = {
      state: {
        doc: { nodeAt: vi.fn(() => ({ type: { name: "text" } })) },
      },
      view: {
        coordsAtPos: vi.fn(() => { throw new Error("invalid pos") }),
        nodeDOM: vi.fn(),
      },
    } as unknown as Editor
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>

    const result = getWordRect(
      { editorIndex: 0, from: 999, to: 1000, text: "x" },
      editorsRef,
      containerRect
    )
    expect(result).toBeNull()
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

// ── findFirstWordOnLine / findLastWordOnLine ──────────────────────

describe("findFirstWordOnLine", () => {
  it("returns leftmost word on the same visual line", () => {
    const candidates = [
      makeCandidateAt(200, 100, "middle"),
      makeCandidateAt(50, 100, "left"),
      makeCandidateAt(350, 100, "right"),
      makeCandidateAt(100, 200, "other-line"),
    ]
    const result = findFirstWordOnLine({ cx: 200, cy: 100 }, candidates)
    expect(result?.text).toBe("left")
  })

  it("returns the only word on a single-word line", () => {
    const candidates = [makeCandidateAt(100, 100, "only")]
    const result = findFirstWordOnLine({ cx: 100, cy: 100 }, candidates)
    expect(result?.text).toBe("only")
  })

  it("returns null for empty candidates", () => {
    expect(findFirstWordOnLine({ cx: 100, cy: 100 }, [])).toBeNull()
  })

  it("ignores words on different lines", () => {
    const candidates = [
      makeCandidateAt(50, 200, "far-below"),
    ]
    expect(findFirstWordOnLine({ cx: 100, cy: 100 }, candidates)).toBeNull()
  })
})

describe("findLastWordOnLine", () => {
  it("returns rightmost word on the same visual line", () => {
    const candidates = [
      makeCandidateAt(50, 100, "left"),
      makeCandidateAt(200, 100, "middle"),
      makeCandidateAt(350, 100, "right"),
      makeCandidateAt(100, 200, "other-line"),
    ]
    const result = findLastWordOnLine({ cx: 100, cy: 100 }, candidates)
    expect(result?.text).toBe("right")
  })

  it("returns the only word on a single-word line", () => {
    const candidates = [makeCandidateAt(100, 100, "only")]
    const result = findLastWordOnLine({ cx: 100, cy: 100 }, candidates)
    expect(result?.text).toBe("only")
  })

  it("returns null for empty candidates", () => {
    expect(findLastWordOnLine({ cx: 100, cy: 100 }, [])).toBeNull()
  })
})

// ── isAtLineStart / isAtLineEnd ─────────────────────────────────

describe("isAtLineStart", () => {
  it("returns true when word is leftmost on its line", () => {
    const candidates = [
      makeCandidateAt(50, 100, "first"),
      makeCandidateAt(150, 100, "second"),
      makeCandidateAt(250, 100, "third"),
    ]
    expect(isAtLineStart({ cx: 50, cy: 100 }, candidates)).toBe(true)
  })

  it("returns false when there are words to the left", () => {
    const candidates = [
      makeCandidateAt(50, 100, "first"),
      makeCandidateAt(150, 100, "second"),
    ]
    expect(isAtLineStart({ cx: 150, cy: 100 }, candidates)).toBe(false)
  })

  it("returns true for empty candidates", () => {
    expect(isAtLineStart({ cx: 100, cy: 100 }, [])).toBe(true)
  })
})

describe("isAtLineEnd", () => {
  it("returns true when word is rightmost on its line", () => {
    const candidates = [
      makeCandidateAt(50, 100, "first"),
      makeCandidateAt(150, 100, "second"),
      makeCandidateAt(250, 100, "third"),
    ]
    expect(isAtLineEnd({ cx: 250, cy: 100 }, candidates)).toBe(true)
  })

  it("returns false when there are words to the right", () => {
    const candidates = [
      makeCandidateAt(50, 100, "first"),
      makeCandidateAt(150, 100, "second"),
    ]
    expect(isAtLineEnd({ cx: 50, cy: 100 }, candidates)).toBe(false)
  })

  it("returns true for empty candidates", () => {
    expect(isAtLineEnd({ cx: 100, cy: 100 }, [])).toBe(true)
  })
})

// ── getWordCenterRelativeToWrapper / getWordRectRelativeToWrapper ──

function createMockEditorForWrapper(coordsMap: Record<number, { left: number; right: number; top: number; bottom: number }>) {
  return {
    state: {
      doc: { nodeAt: vi.fn(() => ({ type: { name: "text" } })) },
    },
    view: {
      coordsAtPos: vi.fn((pos: number) => coordsMap[pos] ?? { left: 0, right: 0, top: 0, bottom: 0 }),
      nodeDOM: vi.fn(),
    },
  } as unknown as Editor
}

function createMockWrapper(rect: { left: number; top: number; width: number; height: number }, scrollLeft = 0, scrollTop = 0) {
  return {
    getBoundingClientRect: () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top, toJSON: () => {} }),
    scrollLeft,
    scrollTop,
  } as unknown as HTMLElement
}

describe("getWordCenterRelativeToWrapper", () => {
  it("returns center relative to the target wrapper", () => {
    const editor = createMockEditorForWrapper({
      5: { left: 60, right: 70, top: 120, bottom: 140 },
      10: { left: 100, right: 110, top: 120, bottom: 140 },
    })
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 10, top: 20, width: 800, height: 600 })

    const result = getWordCenterRelativeToWrapper(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      wrapper
    )

    // cx = (60 + 110) / 2 - 10 + 0 = 85 - 10 = 75
    // cy = (120 + 140) / 2 - 20 + 0 = 130 - 20 = 110
    expect(result).toEqual({ cx: 75, cy: 110 })
  })

  it("accounts for wrapper scroll offset", () => {
    const editor = createMockEditorForWrapper({
      5: { left: 60, right: 70, top: 120, bottom: 140 },
      10: { left: 100, right: 110, top: 120, bottom: 140 },
    })
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 10, top: 20, width: 800, height: 600 }, 30, 50)

    const result = getWordCenterRelativeToWrapper(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      wrapper
    )

    // cx = (60 + 110) / 2 - 10 + 30 = 105
    // cy = (120 + 140) / 2 - 20 + 50 = 160
    expect(result).toEqual({ cx: 105, cy: 160 })
  })

  it("works for cross-editor endpoints (word in different editor than wrapper)", () => {
    const editor0 = createMockEditorForWrapper({
      1: { left: 50, right: 80, top: 100, bottom: 120 },
      5: { left: 80, right: 90, top: 100, bottom: 120 },
    })
    const editor1 = createMockEditorForWrapper({
      10: { left: 400, right: 430, top: 100, bottom: 120 },
      15: { left: 430, right: 460, top: 100, bottom: 120 },
    })
    const editorsRef = { current: new Map([[0, editor0], [1, editor1]]) } as React.RefObject<Map<number, Editor>>
    // Wrapper belongs to editor 0
    const wrapper = createMockWrapper({ left: 20, top: 50, width: 300, height: 400 })

    // Word from editor 1 positioned relative to editor 0's wrapper
    const result = getWordCenterRelativeToWrapper(
      { editorIndex: 1, from: 10, to: 15, text: "world" },
      editorsRef,
      wrapper
    )

    // cx = (400 + 460) / 2 - 20 + 0 = 430 - 20 = 410
    // cy = (100 + 120) / 2 - 50 + 0 = 110 - 50 = 60
    expect(result).toEqual({ cx: 410, cy: 60 })
  })

  it("returns null when editor not found", () => {
    const editorsRef = { current: new Map() } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 0, top: 0, width: 800, height: 600 })

    const result = getWordCenterRelativeToWrapper(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      wrapper
    )
    expect(result).toBeNull()
  })

  it("returns null when coordsAtPos throws", () => {
    const editor = {
      state: {
        doc: { nodeAt: vi.fn(() => ({ type: { name: "text" } })) },
      },
      view: {
        coordsAtPos: vi.fn(() => { throw new Error("invalid pos") }),
        nodeDOM: vi.fn(),
      },
    } as unknown as Editor
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 0, top: 0, width: 800, height: 600 })

    const result = getWordCenterRelativeToWrapper(
      { editorIndex: 0, from: 999, to: 1000, text: "x" },
      editorsRef,
      wrapper
    )
    expect(result).toBeNull()
  })

  it("handles image nodes", () => {
    const imgEl = document.createElement("img")
    imgEl.getBoundingClientRect = () => ({
      left: 100, right: 200, top: 150, bottom: 250,
      width: 100, height: 100, x: 100, y: 150,
      toJSON: () => {},
    })
    const editor = {
      state: {
        doc: { nodeAt: vi.fn(() => ({ type: { name: "image" } })) },
      },
      view: {
        coordsAtPos: vi.fn(),
        nodeDOM: vi.fn(() => imgEl),
      },
    } as unknown as Editor
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 10, top: 20, width: 800, height: 600 })

    const result = getWordCenterRelativeToWrapper(
      { editorIndex: 0, from: 0, to: 1, text: "img" },
      editorsRef,
      wrapper
    )

    // cx = (100 + 200) / 2 - 10 + 0 = 140
    // cy = (150 + 250) / 2 - 20 + 0 = 180
    expect(result).toEqual({ cx: 140, cy: 180 })
  })
})

describe("getWordRectRelativeToWrapper", () => {
  it("returns rect relative to the target wrapper", () => {
    const editor = createMockEditorForWrapper({
      5: { left: 60, right: 70, top: 120, bottom: 140 },
      10: { left: 100, right: 110, top: 120, bottom: 140 },
    })
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 10, top: 20, width: 800, height: 600 })

    const result = getWordRectRelativeToWrapper(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      wrapper
    )

    expect(result).toEqual({
      x: 50,      // 60 - 10
      y: 100,     // 120 - 20
      width: 50,  // 110 - 60
      height: 20, // 140 - 120
    })
  })

  it("accounts for wrapper scroll offset", () => {
    const editor = createMockEditorForWrapper({
      5: { left: 60, right: 70, top: 120, bottom: 140 },
      10: { left: 100, right: 110, top: 120, bottom: 140 },
    })
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 10, top: 20, width: 800, height: 600 }, 30, 50)

    const result = getWordRectRelativeToWrapper(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      wrapper
    )

    expect(result).toEqual({
      x: 80,      // 60 - 10 + 30
      y: 150,     // 120 - 20 + 50
      width: 50,  // 110 - 60
      height: 20, // 140 - 120
    })
  })

  it("returns null when editor not found", () => {
    const editorsRef = { current: new Map() } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 0, top: 0, width: 800, height: 600 })

    const result = getWordRectRelativeToWrapper(
      { editorIndex: 0, from: 5, to: 10, text: "hello" },
      editorsRef,
      wrapper
    )
    expect(result).toBeNull()
  })

  it("handles image nodes", () => {
    const imgEl = document.createElement("img")
    imgEl.getBoundingClientRect = () => ({
      left: 100, right: 200, top: 150, bottom: 250,
      width: 100, height: 100, x: 100, y: 150,
      toJSON: () => {},
    })
    const editor = {
      state: {
        doc: { nodeAt: vi.fn(() => ({ type: { name: "image" } })) },
      },
      view: {
        coordsAtPos: vi.fn(),
        nodeDOM: vi.fn(() => imgEl),
      },
    } as unknown as Editor
    const editorsRef = { current: new Map([[0, editor]]) } as React.RefObject<Map<number, Editor>>
    const wrapper = createMockWrapper({ left: 10, top: 20, width: 800, height: 600 })

    const result = getWordRectRelativeToWrapper(
      { editorIndex: 0, from: 0, to: 1, text: "img" },
      editorsRef,
      wrapper
    )

    expect(result).toEqual({
      x: 90,      // 100 - 10
      y: 130,     // 150 - 20
      width: 100,
      height: 100,
    })
  })
})
