import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useUnifiedDecorations } from "./use-unified-decorations"
import type { Layer } from "@/types/editor"
import { DecorationSet } from "@tiptap/pm/view"
import { layerHighlightsPluginKey } from "@/lib/tiptap/extensions/layer-highlights"

// Track what gets dispatched
let capturedDecorations: unknown[] = []

vi.mock("@tiptap/pm/view", async () => {
  const actual = await vi.importActual("@tiptap/pm/view")
  return {
    ...actual,
    DecorationSet: {
      ...(actual as any).DecorationSet,
      empty: (actual as any).DecorationSet.empty,
      create: vi.fn((_doc: unknown, decorations: unknown[]) => {
        capturedDecorations = decorations
        return { __decorationCount: decorations.length }
      }),
    },
    Decoration: {
      inline: vi.fn((from: number, to: number, attrs: unknown) => ({
        from,
        to,
        attrs,
      })),
    },
  }
})

function createMockEditor() {
  const mockTr = {
    setMeta: vi.fn(() => mockTr),
  }
  return {
    isDestroyed: false,
    state: { doc: {}, tr: mockTr },
    view: { dispatch: vi.fn() },
  }
}

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  }
}

describe("useUnifiedDecorations", () => {
  beforeEach(() => {
    capturedDecorations = []
  })

  it("dispatches empty decorations when not locked", () => {
    const editor = createMockEditor()
    renderHook(() =>
      useUnifiedDecorations(editor as any, [], 0, false, false)
    )
    expect(editor.state.tr.setMeta).toHaveBeenCalledWith(
      layerHighlightsPluginKey,
      DecorationSet.empty
    )
  })

  it("creates decorations for highlights in matching editor", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      highlights: [
        { id: "h1", editorIndex: 0, from: 1, to: 5, text: "test", annotation: "", type: "highlight" },
      ],
    })
    renderHook(() =>
      useUnifiedDecorations(editor as any, [layer], 0, true, false)
    )
    expect(capturedDecorations).toHaveLength(1)
    expect(capturedDecorations[0]).toMatchObject({ from: 1, to: 5 })
  })

  it("skips highlights from other editors", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      highlights: [
        { id: "h1", editorIndex: 1, from: 1, to: 5, text: "test", annotation: "", type: "highlight" },
      ],
    })
    renderHook(() =>
      useUnifiedDecorations(editor as any, [layer], 0, true, false)
    )
    expect(capturedDecorations).toHaveLength(0)
  })

  it("creates decorations for arrow endpoints", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    renderHook(() =>
      useUnifiedDecorations(editor as any, [layer], 0, true, false)
    )
    expect(capturedDecorations).toHaveLength(2)
    // Both should have arrow-endpoint class
    expect((capturedDecorations[0] as any).attrs.class).toBe("arrow-endpoint")
    expect((capturedDecorations[1] as any).attrs.class).toBe("arrow-endpoint")
  })

  it("segments overlapping highlight and arrow into blended pieces", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      highlights: [
        { id: "h1", editorIndex: 0, from: 1, to: 10, text: "highlight", annotation: "", type: "highlight" },
      ],
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 5, to: 15, text: "arrow" },
          to: { editorIndex: 1, from: 1, to: 5, text: "target" },
        },
      ],
    })
    renderHook(() =>
      useUnifiedDecorations(editor as any, [layer], 0, true, false)
    )
    // Breakpoints: 1, 5, 10, 15
    // Segments: [1,5] (highlight only), [5,10] (highlight + arrow), [10,15] (arrow only)
    expect(capturedDecorations).toHaveLength(3)

    const seg1 = capturedDecorations[0] as any
    const seg2 = capturedDecorations[1] as any
    const seg3 = capturedDecorations[2] as any

    expect(seg1.from).toBe(1)
    expect(seg1.to).toBe(5)
    expect(seg1.attrs.class).toBeUndefined() // no arrow endpoint

    expect(seg2.from).toBe(5)
    expect(seg2.to).toBe(10)
    expect(seg2.attrs.class).toBe("arrow-endpoint") // has arrow endpoint

    expect(seg3.from).toBe(10)
    expect(seg3.to).toBe(15)
    expect(seg3.attrs.class).toBe("arrow-endpoint")
  })

  it("blends overlapping highlights from different layers", () => {
    const editor = createMockEditor()
    const layer1 = createLayer({
      id: "l1",
      color: "#fca5a5",
      highlights: [
        { id: "h1", editorIndex: 0, from: 1, to: 10, text: "overlap", annotation: "", type: "highlight" },
      ],
    })
    const layer2 = createLayer({
      id: "l2",
      color: "#93c5fd",
      highlights: [
        { id: "h2", editorIndex: 0, from: 5, to: 15, text: "overlap", annotation: "", type: "highlight" },
      ],
    })
    renderHook(() =>
      useUnifiedDecorations(editor as any, [layer1, layer2], 0, true, false)
    )
    // Breakpoints: 1, 5, 10, 15
    // Segments: [1,5] (red only), [5,10] (red + blue blended), [10,15] (blue only)
    expect(capturedDecorations).toHaveLength(3)

    const seg1 = capturedDecorations[0] as any
    const seg2 = capturedDecorations[1] as any
    const seg3 = capturedDecorations[2] as any

    // The middle segment should have a different color from either endpoint
    expect(seg2.attrs.style).not.toBe(seg1.attrs.style)
    expect(seg2.attrs.style).not.toBe(seg3.attrs.style)
  })

  it("skips hidden layers", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      visible: false,
      highlights: [
        { id: "h1", editorIndex: 0, from: 1, to: 5, text: "test", annotation: "", type: "highlight" },
      ],
    })
    renderHook(() =>
      useUnifiedDecorations(editor as any, [layer], 0, true, false)
    )
    expect(capturedDecorations).toHaveLength(0)
  })
})
