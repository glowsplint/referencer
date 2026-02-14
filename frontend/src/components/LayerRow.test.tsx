import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { LayerRow } from "./LayerRow"
import { TAILWIND_300_COLORS } from "@/types/editor"

import type { Layer, Highlight, Arrow } from "@/types/editor"

const defaultLayer: Layer = { id: "a", name: "Layer 1", color: "#fca5a5", visible: true, highlights: [], arrows: [], underlines: [] }

const makeHighlight = (id: string, text: string, annotation = "", editorIndex = 0): Highlight => ({
  id, editorIndex, from: 0, to: 5, text, annotation, type: "comment",
})

const makeArrow = (id: string, fromText: string, toText: string, fromEditor = 0, toEditor = 1): Arrow => ({
  id,
  from: { editorIndex: fromEditor, from: 0, to: 5, text: fromText },
  to: { editorIndex: toEditor, from: 0, to: 5, text: toText },
  arrowStyle: "solid",
})

function renderRow(overrides = {}) {
  const defaults = {
    layer: defaultLayer,
    index: 0,
    isActive: false,
    sectionNames: ["Passage 1", "Passage 2"],
    onSetActive: vi.fn(),
    onUpdateColor: vi.fn(),
    onUpdateName: vi.fn(),
    onToggleVisibility: vi.fn(),
    onRemoveHighlight: vi.fn(),
    onRemoveArrow: vi.fn(),
    onRemoveUnderline: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<LayerRow {...props} />), props }
}

describe("LayerRow", () => {
  it("renders the layer name", () => {
    renderRow()
    expect(screen.getByText("Layer 1")).toBeInTheDocument()
  })

  it("renders the colour swatch with correct colour", () => {
    renderRow()
    const swatch = screen.getByTestId("layerSwatch-0")
    expect(swatch.style.backgroundColor).toBe("rgb(252, 165, 165)")
  })

  it("has draggable attribute on outer container", () => {
    const { container } = renderRow()
    const outer = container.querySelector(".relative")
    expect(outer).toHaveAttribute("draggable", "true")
  })

  it("sets layer id in dataTransfer on dragstart", () => {
    const { container } = renderRow()
    const outer = container.querySelector(".relative")!
    const dataTransfer = { setData: vi.fn() }
    fireEvent.dragStart(outer, { dataTransfer })
    expect(dataTransfer.setData).toHaveBeenCalledWith("application/x-layer-id", "a")
  })

  it("opens colour picker when swatch is clicked", () => {
    renderRow()
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument()
  })

  it("closes colour picker when swatch is clicked again", () => {
    renderRow()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
  })

  it("calls onUpdateColor when a colour is selected", () => {
    const { props } = renderRow()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[5]}`))
    expect(props.onUpdateColor).toHaveBeenCalledWith(TAILWIND_300_COLORS[5])
  })

  it("closes colour picker after selecting a colour", () => {
    renderRow()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[5]}`))
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
  })

  it("shows Active tag when isActive is true", () => {
    renderRow({ isActive: true })
    expect(screen.getByTestId("layerActiveTag-0")).toHaveTextContent("Active")
  })

  it("does not show Active tag when isActive is false", () => {
    renderRow({ isActive: false })
    expect(screen.queryByTestId("layerActiveTag-0")).not.toBeInTheDocument()
  })

  it("highlights with bg-accent when active", () => {
    const { container } = renderRow({ isActive: true })
    const row = container.querySelector(".relative > div:first-child")
    expect(row).toHaveClass("bg-accent")
  })

  it("has hover:bg-accent/50 when inactive", () => {
    const { container } = renderRow({ isActive: false })
    const row = container.querySelector(".relative > div:first-child")
    expect(row).toHaveClass("hover:bg-accent/50")
    expect(row).not.toHaveClass("bg-accent")
  })

  it("single clicking layer name does not enter edit mode", () => {
    renderRow()
    fireEvent.click(screen.getByTestId("layerName-0"))
    expect(screen.queryByTestId("layerNameInput-0")).not.toBeInTheDocument()
  })

  it("double clicking layer name enters edit mode", () => {
    renderRow()
    fireEvent.doubleClick(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    expect(input).toBeInTheDocument()
    expect((input as HTMLInputElement).value).toBe("Layer 1")
  })

  it("pressing Enter commits the new name", () => {
    const { props } = renderRow()
    fireEvent.doubleClick(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "My Layer" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(props.onUpdateName).toHaveBeenCalledWith("My Layer")
  })

  it("pressing Escape cancels editing", () => {
    const { props } = renderRow()
    fireEvent.doubleClick(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "My Layer" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(props.onUpdateName).not.toHaveBeenCalled()
    expect(screen.getByTestId("layerName-0")).toBeInTheDocument()
  })

  it("blur commits the new name", () => {
    const { props } = renderRow()
    fireEvent.doubleClick(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "Blurred Name" } })
    fireEvent.blur(input)
    expect(props.onUpdateName).toHaveBeenCalledWith("Blurred Name")
  })

  it("empty input reverts to previous name on commit", () => {
    const { props } = renderRow()
    fireEvent.doubleClick(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "   " } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(props.onUpdateName).toHaveBeenCalledWith("Layer 1")
  })

  it("calls onSetActive when clicking the row", () => {
    const { container, props } = renderRow()
    const row = container.querySelector(".relative > div:first-child")!
    fireEvent.click(row)
    expect(props.onSetActive).toHaveBeenCalled()
  })

  it("colour swatch has hover and cursor-pointer classes", () => {
    renderRow()
    const swatch = screen.getByTestId("layerSwatch-0")
    expect(swatch).toHaveClass("hover:border-black/30")
    expect(swatch).toHaveClass("cursor-pointer")
    expect(swatch).toHaveClass("transition-colors")
    expect(swatch).toHaveClass("border-2")
  })

  it("layer name has correct classes", () => {
    renderRow()
    const nameEl = screen.getByTestId("layerName-0")
    expect(nameEl).toHaveClass("truncate")
    expect(nameEl).not.toHaveClass("hover:ring-border")
    expect(nameEl).not.toHaveClass("cursor-text")
    expect(nameEl).not.toHaveClass("flex-1")
  })

  it("renders eye icon when layer is visible", () => {
    renderRow()
    const btn = screen.getByTestId("layerVisibility-0")
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute("title", "Hide layer")
  })

  it("renders eye-off icon when layer is hidden", () => {
    renderRow({ layer: { ...defaultLayer, visible: false } })
    const btn = screen.getByTestId("layerVisibility-0")
    expect(btn).toHaveAttribute("title", "Show layer")
  })

  it("calls onToggleVisibility when visibility button is clicked", () => {
    const { props } = renderRow()
    fireEvent.click(screen.getByTestId("layerVisibility-0"))
    expect(props.onToggleVisibility).toHaveBeenCalled()
  })

  it("visibility toggle does not trigger onSetActive", () => {
    const { props } = renderRow()
    fireEvent.click(screen.getByTestId("layerVisibility-0"))
    expect(props.onSetActive).not.toHaveBeenCalled()
  })

  it("layer name swaps from div to input when entering edit mode", () => {
    renderRow()
    const label = screen.getByTestId("layerName-0")
    expect(label.tagName).toBe("DIV")
    fireEvent.doubleClick(label)
    expect(screen.queryByTestId("layerName-0")).not.toBeInTheDocument()
    const input = screen.getByTestId("layerNameInput-0")
    expect(input.tagName).toBe("INPUT")
    expect(input).toHaveClass("ring-border")
  })

  // --- Expand / collapse ---

  it("does not show chevron or count badge for empty layer", () => {
    renderRow()
    expect(screen.queryByTestId("layerExpand-0")).not.toBeInTheDocument()
    expect(screen.queryByTestId("layerItemCount-0")).not.toBeInTheDocument()
  })

  it("shows chevron and count badge when layer has highlights", () => {
    const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] }
    renderRow({ layer })
    expect(screen.getByTestId("layerExpand-0")).toBeInTheDocument()
    expect(screen.getByTestId("layerItemCount-0")).toHaveTextContent("1")
  })

  it("shows chevron and count badge when layer has arrows", () => {
    const layer = { ...defaultLayer, arrows: [makeArrow("a1", "foo", "bar")] }
    renderRow({ layer })
    expect(screen.getByTestId("layerExpand-0")).toBeInTheDocument()
    expect(screen.getByTestId("layerItemCount-0")).toHaveTextContent("1")
  })

  it("shows combined count for highlights and arrows", () => {
    const layer = {
      ...defaultLayer,
      highlights: [makeHighlight("h1", "hello"), makeHighlight("h2", "world")],
      arrows: [makeArrow("a1", "foo", "bar")],
    }
    renderRow({ layer })
    expect(screen.getByTestId("layerItemCount-0")).toHaveTextContent("3")
  })

  it("expands when chevron is clicked and hides count badge", () => {
    const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] }
    renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    expect(screen.getByTestId("layerItems-0")).toBeInTheDocument()
    expect(screen.queryByTestId("layerItemCount-0")).not.toBeInTheDocument()
  })

  it("collapses when chevron is clicked again", () => {
    const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] }
    renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    expect(screen.getByTestId("layerItems-0")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    expect(screen.queryByTestId("layerItems-0")).not.toBeInTheDocument()
  })

  it("renders highlight items with annotation text when expanded", () => {
    const layer = {
      ...defaultLayer,
      highlights: [makeHighlight("h1", "selected text", "my note")],
    }
    renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    expect(screen.getByTestId("layerHighlight-h1")).toBeInTheDocument()
    expect(screen.getByText("my note")).toBeInTheDocument()
  })

  it("renders highlight with selected text when annotation is empty", () => {
    const layer = {
      ...defaultLayer,
      highlights: [makeHighlight("h1", "selected text", "")],
    }
    renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    expect(screen.getByText("selected text")).toBeInTheDocument()
  })

  it("renders arrow items with first word and word count when expanded", () => {
    const layer = {
      ...defaultLayer,
      arrows: [makeArrow("a1", "hello beautiful world", "goodbye cruel world")],
    }
    renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    expect(screen.getByTestId("layerArrow-a1")).toBeInTheDocument()
    expect(screen.getByText("hello (3) → goodbye (3)")).toBeInTheDocument()
  })

  it("calls onRemoveHighlight when highlight delete button is clicked", () => {
    const layer = {
      ...defaultLayer,
      highlights: [makeHighlight("h1", "hello")],
    }
    const { props } = renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    fireEvent.click(screen.getByTestId("removeHighlight-h1"))
    expect(props.onRemoveHighlight).toHaveBeenCalledWith("a", "h1")
  })

  it("calls onRemoveArrow when arrow delete button is clicked", () => {
    const layer = {
      ...defaultLayer,
      arrows: [makeArrow("a1", "hello", "world")],
    }
    const { props } = renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    fireEvent.click(screen.getByTestId("removeArrow-a1"))
    expect(props.onRemoveArrow).toHaveBeenCalledWith("a", "a1")
  })

  it("chevron click does not trigger onSetActive", () => {
    const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] }
    const { props } = renderRow({ layer })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    expect(props.onSetActive).not.toHaveBeenCalled()
  })

  it("highlight title includes passage name", () => {
    const layer = {
      ...defaultLayer,
      highlights: [makeHighlight("h1", "hello", "note", 1)],
    }
    renderRow({ layer, sectionNames: ["Intro", "Body"] })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    const span = screen.getByText("note")
    expect(span).toHaveAttribute("title", "note (Body)")
  })

  it("arrow title includes passage names", () => {
    const layer = {
      ...defaultLayer,
      arrows: [makeArrow("a1", "foo", "bar", 0, 1)],
    }
    renderRow({ layer, sectionNames: ["Intro", "Body"] })
    fireEvent.click(screen.getByTestId("layerExpand-0"))
    const span = screen.getByText("foo (1) → bar (1)")
    expect(span).toHaveAttribute("title", "foo (Intro) → bar (Body)")
  })

})
