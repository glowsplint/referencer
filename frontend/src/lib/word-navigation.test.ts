import { describe, it, expect, vi } from "vitest"
import type { Editor } from "@tiptap/react"
import type { WordCenter } from "@/lib/tiptap/nearest-word"
import type { CollectedWord } from "@/lib/tiptap/word-collection"
import type { WordSelection } from "@/types/editor"

vi.mock("@/lib/tiptap/word-collection", () => ({
  collectAllWords: vi.fn(() => []),
}))

vi.mock("@/lib/tiptap/nearest-word", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tiptap/nearest-word")>(
    "@/lib/tiptap/nearest-word"
  )
  return {
    ...actual,
    getWordCenter: vi.fn(() => null),
  }
})

import { collectAllWords } from "@/lib/tiptap/word-collection"
import { getWordCenter } from "@/lib/tiptap/nearest-word"
import {
  collectCandidates,
  findHorizontalTarget,
  findVerticalTarget,
  resolveNavigationTarget,
  computeRangeSelection,
  findFirstWordInPassage,
  findLastWordInPassage,
  computeSelectAllInPassage,
} from "./word-navigation"

// ── helpers ──────────────────────────────────────────────────────────

function makeWord(
  editorIndex: number,
  from: number,
  to: number,
  text: string
): CollectedWord {
  return { editorIndex, from, to, text }
}

function makeCenter(word: CollectedWord, cx: number, cy: number): WordCenter {
  return { word, cx, cy }
}

function makeFakeContainerRect(): DOMRect {
  return {
    left: 0, top: 0, right: 800, bottom: 600,
    width: 800, height: 600, x: 0, y: 0, toJSON: () => {},
  } as DOMRect
}

// ── collectCandidates ────────────────────────────────────────────────

describe("collectCandidates", () => {
  it("returns empty array when no editors are available", () => {
    const editorsRef = { current: new Map() } as React.RefObject<Map<number, Editor>>
    const result = collectCandidates({
      editorsRef,
      containerRect: makeFakeContainerRect(),
      editorCount: 2,
    })
    expect(result).toEqual([])
  })

  it("collects words from all editors and returns their centers", () => {
    const editor0 = {} as Editor
    const editor1 = {} as Editor
    const editorsRef = { current: new Map<number, Editor>([[0, editor0], [1, editor1]]) } as React.RefObject<Map<number, Editor>>

    const word0 = makeWord(0, 1, 4, "and")
    const word1 = makeWord(1, 1, 5, "over")

    vi.mocked(collectAllWords).mockImplementation((_editor, editorIndex) => {
      if (editorIndex === 0) return [word0]
      if (editorIndex === 1) return [word1]
      return []
    })

    vi.mocked(getWordCenter).mockImplementation((word) => {
      if (word.from === 1 && word.editorIndex === 0) return { cx: 100, cy: 100 }
      if (word.from === 1 && word.editorIndex === 1) return { cx: 400, cy: 100 }
      return null
    })

    const result = collectCandidates({
      editorsRef,
      containerRect: makeFakeContainerRect(),
      editorCount: 2,
    })

    expect(result).toHaveLength(2)
    expect(result[0].word.text).toBe("and")
    expect(result[0].cx).toBe(100)
    expect(result[1].word.text).toBe("over")
    expect(result[1].cx).toBe(400)
  })

  it("skips words whose center cannot be computed", () => {
    const editor0 = {} as Editor
    const editorsRef = { current: new Map<number, Editor>([[0, editor0]]) } as React.RefObject<Map<number, Editor>>

    const word0 = makeWord(0, 1, 4, "and")
    const word1 = makeWord(0, 5, 10, "broken")

    vi.mocked(collectAllWords).mockReturnValue([word0, word1])
    vi.mocked(getWordCenter).mockImplementation((word) => {
      if (word.from === 1) return { cx: 100, cy: 100 }
      return null // "broken" has no center
    })

    const result = collectCandidates({
      editorsRef,
      containerRect: makeFakeContainerRect(),
      editorCount: 1,
    })

    expect(result).toHaveLength(1)
    expect(result[0].word.text).toBe("and")
  })
})

// ── findHorizontalTarget ─────────────────────────────────────────────

describe("findHorizontalTarget", () => {
  // Layout:  "the"(50,100)  "quick"(120,100)  "brown"(200,100)
  //          "fox"(60,130)
  const the = makeWord(0, 1, 4, "the")
  const quick = makeWord(0, 5, 10, "quick")
  const brown = makeWord(0, 11, 16, "brown")
  const fox = makeWord(0, 20, 23, "fox")

  const candidates: WordCenter[] = [
    makeCenter(the, 50, 100),
    makeCenter(quick, 120, 100),
    makeCenter(brown, 200, 100),
    makeCenter(fox, 60, 130),
  ]

  it("finds next word to the right on the same line", () => {
    const result = findHorizontalTarget("ArrowRight", { cx: 50, cy: 100 }, candidates)
    expect(result.target?.text).toBe("quick")
    expect(result.stickyX).toBeNull()
  })

  it("finds next word to the left on the same line", () => {
    const result = findHorizontalTarget("ArrowLeft", { cx: 200, cy: 100 }, candidates)
    expect(result.target?.text).toBe("quick")
    expect(result.stickyX).toBeNull()
  })

  it("wraps to next line when no more words in direction", () => {
    const result = findHorizontalTarget("ArrowRight", { cx: 200, cy: 100 }, candidates)
    // No word to the right on cy=100, wraps to next line => "fox" (leftmost on line below)
    expect(result.target?.text).toBe("fox")
    expect(result.stickyX).toBeNull()
  })

  it("always returns stickyX as null", () => {
    const result = findHorizontalTarget("ArrowLeft", { cx: 50, cy: 100 }, candidates)
    expect(result.stickyX).toBeNull()
  })

  it("returns null target when no candidate exists in the direction", () => {
    const result = findHorizontalTarget("ArrowLeft", { cx: 60, cy: 130 }, [
      makeCenter(fox, 60, 130),
    ])
    expect(result.target).toBeNull()
  })
})

// ── findVerticalTarget ───────────────────────────────────────────────

describe("findVerticalTarget", () => {
  // Two-editor layout:
  // Editor 0: "and"(100,100) "pro"(80,130) "place"(90,160)
  // Editor 1: "Integrate"(400,100) "stuff"(420,130)

  const and_ = makeWord(0, 1, 4, "and")
  const pro = makeWord(0, 10, 13, "pro")
  const place = makeWord(0, 20, 25, "place")
  const integrate = makeWord(1, 1, 10, "Integrate")
  const stuff = makeWord(1, 15, 20, "stuff")

  const candidates: WordCenter[] = [
    makeCenter(and_, 100, 100),
    makeCenter(pro, 80, 130),
    makeCenter(place, 90, 160),
    makeCenter(integrate, 400, 100),
    makeCenter(stuff, 420, 130),
  ]

  it("prefers same-editor candidate over cross-editor", () => {
    const result = findVerticalTarget(
      "ArrowDown",
      { cx: 100, cy: 100 },
      candidates,
      and_,
      null
    )
    expect(result.target?.text).toBe("pro")
    expect(result.target?.editorIndex).toBe(0)
  })

  it("initializes stickyX from currentCenter.cx when stickyX is null", () => {
    const result = findVerticalTarget(
      "ArrowDown",
      { cx: 100, cy: 100 },
      candidates,
      and_,
      null
    )
    expect(result.stickyX).toBe(100)
  })

  it("preserves an existing stickyX value", () => {
    const result = findVerticalTarget(
      "ArrowDown",
      { cx: 80, cy: 130 }, // "pro" center
      candidates,
      pro,
      100 // sticky from "and"
    )
    expect(result.stickyX).toBe(100)
    expect(result.target?.text).toBe("place")
  })

  it("falls back to cross-editor spatial when same editor is exhausted", () => {
    const result = findVerticalTarget(
      "ArrowDown",
      { cx: 90, cy: 160 },
      candidates,
      place,
      null
    )
    // No more lines below in editor 0, so cross-editor or reading order
    expect(result.target).not.toBeNull()
    expect(result.target?.editorIndex).toBe(1)
  })

  it("ArrowUp finds word on previous line in same editor", () => {
    const result = findVerticalTarget(
      "ArrowUp",
      { cx: 80, cy: 130 },
      candidates,
      pro,
      null
    )
    expect(result.target?.text).toBe("and")
    expect(result.target?.editorIndex).toBe(0)
  })
})

// ── resolveNavigationTarget ──────────────────────────────────────────

describe("resolveNavigationTarget", () => {
  const the = makeWord(0, 1, 4, "the")
  const quick = makeWord(0, 5, 10, "quick")
  const fox = makeWord(0, 20, 23, "fox")

  const candidates: WordCenter[] = [
    makeCenter(the, 50, 100),
    makeCenter(quick, 120, 100),
    makeCenter(fox, 60, 130),
  ]

  it("delegates ArrowRight to findHorizontalTarget", () => {
    const result = resolveNavigationTarget(
      "ArrowRight",
      { cx: 50, cy: 100 },
      candidates,
      the,
      42
    )
    expect(result.target?.text).toBe("quick")
    expect(result.stickyX).toBeNull() // horizontal always clears
  })

  it("delegates ArrowDown to findVerticalTarget", () => {
    const result = resolveNavigationTarget(
      "ArrowDown",
      { cx: 50, cy: 100 },
      candidates,
      the,
      null
    )
    expect(result.target?.text).toBe("fox")
    expect(result.stickyX).toBe(50)
  })
})

// ── computeRangeSelection ────────────────────────────────────────────

describe("computeRangeSelection", () => {
  it("computes a merged range within the same editor", () => {
    const anchor: WordSelection = { editorIndex: 0, from: 1, to: 4, text: "the" }
    const target = makeWord(0, 5, 10, "quick")
    const fakeEditor = {
      state: {
        doc: {
          textBetween: (from: number, to: number) => {
            if (from === 1 && to === 10) return "the quick"
            return ""
          },
        },
      },
    } as unknown as Editor

    const result = computeRangeSelection(anchor, target, fakeEditor)
    expect(result).toEqual({
      editorIndex: 0,
      from: 1,
      to: 10,
      text: "the quick",
    })
  })

  it("returns null when target is in a different editor", () => {
    const anchor: WordSelection = { editorIndex: 0, from: 1, to: 4, text: "the" }
    const target = makeWord(1, 1, 5, "over")
    const fakeEditor = {} as Editor

    const result = computeRangeSelection(anchor, target, fakeEditor)
    expect(result).toBeNull()
  })

  it("handles backward ranges (target.from < anchor.from)", () => {
    const anchor: WordSelection = { editorIndex: 0, from: 11, to: 16, text: "brown" }
    const target = makeWord(0, 5, 10, "quick")
    const fakeEditor = {
      state: {
        doc: {
          textBetween: (from: number, to: number) => {
            if (from === 5 && to === 16) return "quick brown"
            return ""
          },
        },
      },
    } as unknown as Editor

    const result = computeRangeSelection(anchor, target, fakeEditor)
    expect(result).toEqual({
      editorIndex: 0,
      from: 5,
      to: 16,
      text: "quick brown",
    })
  })
})

// ── findFirstWordInPassage / findLastWordInPassage ───────────────

describe("findFirstWordInPassage", () => {
  const a = makeWord(0, 10, 15, "alpha")
  const b = makeWord(0, 1, 5, "beta")
  const c = makeWord(1, 3, 8, "gamma")

  const candidates: WordCenter[] = [
    makeCenter(a, 100, 100),
    makeCenter(b, 50, 100),
    makeCenter(c, 400, 100),
  ]

  it("returns word with smallest from in the passage", () => {
    const result = findFirstWordInPassage(0, candidates)
    expect(result?.text).toBe("beta")
    expect(result?.from).toBe(1)
  })

  it("filters by editorIndex", () => {
    const result = findFirstWordInPassage(1, candidates)
    expect(result?.text).toBe("gamma")
  })

  it("returns null for empty passage", () => {
    expect(findFirstWordInPassage(2, candidates)).toBeNull()
  })
})

describe("findLastWordInPassage", () => {
  const a = makeWord(0, 1, 5, "alpha")
  const b = makeWord(0, 10, 20, "beta")
  const c = makeWord(1, 3, 8, "gamma")

  const candidates: WordCenter[] = [
    makeCenter(a, 50, 100),
    makeCenter(b, 150, 100),
    makeCenter(c, 400, 100),
  ]

  it("returns word with largest to in the passage", () => {
    const result = findLastWordInPassage(0, candidates)
    expect(result?.text).toBe("beta")
    expect(result?.to).toBe(20)
  })

  it("filters by editorIndex", () => {
    const result = findLastWordInPassage(1, candidates)
    expect(result?.text).toBe("gamma")
  })

  it("returns null for empty passage", () => {
    expect(findLastWordInPassage(2, candidates)).toBeNull()
  })
})

// ── computeSelectAllInPassage ───────────────────────────────────

describe("computeSelectAllInPassage", () => {
  it("spans from first to last word in passage", () => {
    const a = makeWord(0, 1, 5, "alpha")
    const b = makeWord(0, 6, 12, "bravo")
    const c = makeWord(0, 13, 20, "charlie")

    const candidates: WordCenter[] = [
      makeCenter(a, 50, 100),
      makeCenter(b, 120, 100),
      makeCenter(c, 200, 100),
    ]

    const fakeEditor = {
      state: {
        doc: {
          textBetween: (from: number, to: number) => {
            if (from === 1 && to === 20) return "alpha bravo charlie"
            return ""
          },
        },
      },
    } as unknown as Editor

    const result = computeSelectAllInPassage(0, candidates, fakeEditor)
    expect(result).toEqual({
      editorIndex: 0,
      from: 1,
      to: 20,
      text: "alpha bravo charlie",
    })
  })

  it("handles a single word", () => {
    const a = makeWord(0, 5, 10, "alone")
    const candidates: WordCenter[] = [makeCenter(a, 100, 100)]

    const fakeEditor = {
      state: {
        doc: {
          textBetween: (from: number, to: number) => {
            if (from === 5 && to === 10) return "alone"
            return ""
          },
        },
      },
    } as unknown as Editor

    const result = computeSelectAllInPassage(0, candidates, fakeEditor)
    expect(result).toEqual({
      editorIndex: 0,
      from: 5,
      to: 10,
      text: "alone",
    })
  })

  it("returns null for empty passage", () => {
    const fakeEditor = {} as Editor
    expect(computeSelectAllInPassage(2, [], fakeEditor)).toBeNull()
  })
})
