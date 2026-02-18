import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useUnderlineMode } from "./use-underline-mode"
import type { WordSelection, ActiveTool, LayerUnderline } from "@/types/editor"

function createOptions(overrides: Record<string, unknown> = {}) {
  return {
    isLocked: true,
    activeTool: "underline" as ActiveTool,
    selection: null as WordSelection | null,
    activeLayerId: "layer-1",
    addLayer: vi.fn(() => "auto-layer-1"),
    layers: [] as { id: string; underlines: LayerUnderline[] }[],
    addUnderline: vi.fn().mockReturnValue("u-1"),
    removeUnderline: vi.fn(),
    showUnderlineToasts: true,
    setStatus: vi.fn(),
    clearStatus: vi.fn(),
    ...overrides,
  }
}

const word1: WordSelection = { editorIndex: 0, from: 1, to: 5, text: "hello" }

describe("useUnderlineMode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows entry status when underline tool is activated", () => {
    const setStatus = vi.fn()
    renderHook(() => useUnderlineMode(createOptions({ setStatus })))

    expect(setStatus).toHaveBeenCalledWith(
      expect.objectContaining({ type: "info" })
    )
  })

  it("clears status when exiting underline tool to selection", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useUnderlineMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "underline" as ActiveTool } }
    )

    rerender({ activeTool: "selection" })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("does not clear status when switching to another annotation tool", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { activeTool: ActiveTool }) =>
        useUnderlineMode(createOptions({ activeTool: props.activeTool, clearStatus })),
      { initialProps: { activeTool: "underline" as ActiveTool } }
    )

    rerender({ activeTool: "arrow" })
    expect(clearStatus).not.toHaveBeenCalled()
  })

  it("clears status when unlocking while underline tool is active", () => {
    const clearStatus = vi.fn()
    const { rerender } = renderHook(
      (props: { isLocked: boolean }) =>
        useUnderlineMode(createOptions({ isLocked: props.isLocked, clearStatus })),
      { initialProps: { isLocked: true } }
    )

    rerender({ isLocked: false })
    expect(clearStatus).toHaveBeenCalled()
  })

  it("suppresses entry status when showUnderlineToasts is false", () => {
    const setStatus = vi.fn()
    renderHook(() => useUnderlineMode(createOptions({ showUnderlineToasts: false, setStatus })))

    expect(setStatus).not.toHaveBeenCalled()
  })

  it("does nothing when activeTool is not underline", () => {
    const opts = createOptions({ activeTool: "selection", selection: word1 })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(opts.addUnderline).not.toHaveBeenCalled()
  })

  it("does nothing when isLocked is false", () => {
    const opts = createOptions({ isLocked: false, selection: word1 })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(opts.addUnderline).not.toHaveBeenCalled()
  })

  it("does nothing when there is no selection", () => {
    const opts = createOptions({ selection: null })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(opts.addUnderline).not.toHaveBeenCalled()
  })

  it("creates underline on confirm", () => {
    const opts = createOptions({ selection: word1 })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(opts.addUnderline).toHaveBeenCalledWith("layer-1", {
      editorIndex: 0,
      from: 1,
      to: 5,
      text: "hello",
    })
  })

  it("shows success status when underline is created", () => {
    const setStatus = vi.fn()
    const opts = createOptions({ selection: word1, setStatus })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(setStatus).toHaveBeenCalledWith(
      { text: "Underline added.", type: "success" }, 1500
    )
  })

  it("does not show success status when showUnderlineToasts is false", () => {
    const setStatus = vi.fn()
    const opts = createOptions({ selection: word1, showUnderlineToasts: false, setStatus })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(opts.addUnderline).toHaveBeenCalled()
    const successCalls = setStatus.mock.calls.filter(
      (c: unknown[]) => (c[0] as { type: string })?.type === "success"
    )
    expect(successCalls).toHaveLength(0)
  })

  it("auto-creates a layer when no active layer", () => {
    const addLayer = vi.fn(() => "auto-layer-1")
    const addUnderline = vi.fn().mockReturnValue("u-1")
    const opts = createOptions({ activeLayerId: null, addLayer, addUnderline, selection: word1 })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(addLayer).toHaveBeenCalled()
    expect(addUnderline).toHaveBeenCalledWith("auto-layer-1", {
      editorIndex: 0, from: 1, to: 5, text: "hello",
    })
  })

  it("does nothing when addLayer fails (all colors used)", () => {
    const addLayer = vi.fn(() => "")
    const opts = createOptions({ activeLayerId: null, addLayer, selection: word1 })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(addLayer).toHaveBeenCalled()
    expect(opts.addUnderline).not.toHaveBeenCalled()
  })

  it("toggles off existing underline when same range selected", () => {
    const opts = createOptions({
      selection: word1,
      layers: [{
        id: "layer-1",
        underlines: [
          { id: "u-existing", editorIndex: 0, from: 1, to: 5, text: "hello" },
        ],
      }],
    })
    const { result } = renderHook(() => useUnderlineMode(opts))

    act(() => { result.current.confirmUnderline() })

    expect(opts.removeUnderline).toHaveBeenCalledWith("layer-1", "u-existing")
    expect(opts.addUnderline).not.toHaveBeenCalled()
  })
})
