import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useLayerDecorations } from "./use-layer-decorations"
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
      ...actual.DecorationSet,
      empty: actual.DecorationSet.empty,
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
    ...overrides,
  }
}

describe("useLayerDecorations", () => {
  beforeEach(() => {
    capturedDecorations = []
  })

  it("dispatches empty decorations when not locked", () => {
    const editor = createMockEditor()
    renderHook(() =>
      useLayerDecorations(editor as any, [], 0, false)
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
        { id: "h1", editorIndex: 0, from: 1, to: 5, text: "test" },
      ],
    })
    renderHook(() =>
      useLayerDecorations(editor as any, [layer], 0, true)
    )
    expect(capturedDecorations).toHaveLength(1)
    expect(capturedDecorations[0]).toEqual({
      from: 1,
      to: 5,
      attrs: { style: "background-color: rgba(252, 165, 165, 0.3)" },
    })
  })

  it("skips highlights from other editors", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      highlights: [
        { id: "h1", editorIndex: 1, from: 1, to: 5, text: "test" },
      ],
    })
    renderHook(() =>
      useLayerDecorations(editor as any, [layer], 0, true)
    )
    expect(capturedDecorations).toHaveLength(0)
  })

  it("creates decorations for both arrow endpoints in same editor", () => {
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
      useLayerDecorations(editor as any, [layer], 0, true)
    )
    expect(capturedDecorations).toHaveLength(2)
    expect(capturedDecorations[0]).toEqual({
      from: 1,
      to: 5,
      attrs: { style: "background-color: rgba(252, 165, 165, 0.3)" },
    })
    expect(capturedDecorations[1]).toEqual({
      from: 10,
      to: 15,
      attrs: { style: "background-color: rgba(252, 165, 165, 0.3)" },
    })
  })

  it("only creates decoration for arrow endpoint in this editor", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 1, from: 10, to: 15, text: "world" },
        },
      ],
    })
    renderHook(() =>
      useLayerDecorations(editor as any, [layer], 0, true)
    )
    // Only "from" endpoint is in editor 0
    expect(capturedDecorations).toHaveLength(1)
    expect(capturedDecorations[0]).toEqual({
      from: 1,
      to: 5,
      attrs: { style: "background-color: rgba(252, 165, 165, 0.3)" },
    })
  })

  it("skips arrow endpoints from invisible layers", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      visible: false,
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    renderHook(() =>
      useLayerDecorations(editor as any, [layer], 0, true)
    )
    expect(capturedDecorations).toHaveLength(0)
  })

  it("combines highlights and arrow endpoint decorations", () => {
    const editor = createMockEditor()
    const layer = createLayer({
      highlights: [
        { id: "h1", editorIndex: 0, from: 20, to: 25, text: "highlight" },
      ],
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    renderHook(() =>
      useLayerDecorations(editor as any, [layer], 0, true)
    )
    // 1 highlight + 2 arrow endpoints = 3 decorations
    expect(capturedDecorations).toHaveLength(3)
  })
})
