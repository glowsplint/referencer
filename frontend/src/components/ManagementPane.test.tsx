import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ManagementPane } from "./ManagementPane"
import { TAILWIND_300_COLORS } from "@/types/editor"

function renderPane(overrides = {}) {
  const defaults = {
    layers: [] as { id: string; name: string; color: string; highlights: unknown[] }[],
    activeLayerId: null as string | null,
    editorCount: 1,
    removeLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    updateLayerColor: vi.fn(),
    updateLayerName: vi.fn(),
    removeEditor: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<ManagementPane {...props} />), props }
}

describe("ManagementPane", () => {
  it("renders the management pane", () => {
    renderPane()
    expect(screen.getByTestId("managementPane")).toBeInTheDocument()
  })

  it("shows 'No layers' when layers is empty", () => {
    renderPane()
    expect(screen.getByText("No layers")).toBeInTheDocument()
  })

  it("renders layer rows with labels", () => {
    renderPane({
      layers: [
        { id: "a", name: "Layer 1", color: "#fca5a5" },
        { id: "b", name: "Layer 2", color: "#93c5fd" },
      ],
    })
    expect(screen.getByText("Layer 1")).toBeInTheDocument()
    expect(screen.getByText("Layer 2")).toBeInTheDocument()
  })

  it("renders colour swatches for each layer", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    const swatch = screen.getByTestId("layerSwatch-0")
    expect(swatch.style.backgroundColor).toBe("rgb(252, 165, 165)")
  })

  it("calls removeLayer when X button is clicked", () => {
    const { props } = renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("removeLayer-0"))
    expect(props.removeLayer).toHaveBeenCalledWith("a")
  })

  it("opens colour picker when swatch is clicked", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument()
  })

  it("closes colour picker when swatch is clicked again", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
  })

  it("calls updateLayerColor when a colour is selected", () => {
    const { props } = renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[5]}`))
    expect(props.updateLayerColor).toHaveBeenCalledWith(
      "a",
      TAILWIND_300_COLORS[5]
    )
  })

  it("closes colour picker after selecting a colour", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[5]}`))
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
  })

  it("renders section rows with labels", () => {
    renderPane({ editorCount: 2 })
    expect(screen.getByText("Section 1")).toBeInTheDocument()
    expect(screen.getByText("Section 2")).toBeInTheDocument()
  })

  it("calls removeEditor when section X button is clicked", () => {
    const { props } = renderPane({ editorCount: 2 })
    fireEvent.click(screen.getByTestId("removeSection-1"))
    expect(props.removeEditor).toHaveBeenCalledWith(1)
  })

  it("hides remove button when only one section exists", () => {
    renderPane({ editorCount: 1 })
    expect(screen.queryByTestId("removeSection-0")).not.toBeInTheDocument()
  })

  it("shows remove buttons when multiple sections exist", () => {
    renderPane({ editorCount: 2 })
    expect(screen.getByTestId("removeSection-0")).toBeInTheDocument()
    expect(screen.getByTestId("removeSection-1")).toBeInTheDocument()
  })

  it("renders all 19 colour options in the picker", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    for (const color of TAILWIND_300_COLORS) {
      expect(screen.getByTestId(`colorOption-${color}`)).toBeInTheDocument()
    }
  })

  it("layer name shows hover outline class", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    const nameSpan = screen.getByTestId("layerName-0")
    expect(nameSpan).toHaveClass("hover:ring-border")
    expect(nameSpan).toHaveClass("cursor-text")
    expect(nameSpan).toHaveClass("whitespace-nowrap")
  })

  it("clicking layer name enters edit mode", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    expect(input).toBeInTheDocument()
    expect((input as HTMLInputElement).value).toBe("Layer 1")
  })

  it("pressing Enter commits the new name", () => {
    const { props } = renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "My Layer" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(props.updateLayerName).toHaveBeenCalledWith("a", "My Layer")
  })

  it("pressing Escape cancels editing", () => {
    const { props } = renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "My Layer" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(props.updateLayerName).not.toHaveBeenCalled()
    // Should return to read-only mode
    expect(screen.getByTestId("layerName-0")).toBeInTheDocument()
  })

  it("blur commits the new name", () => {
    const { props } = renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "Blurred Name" } })
    fireEvent.blur(input)
    expect(props.updateLayerName).toHaveBeenCalledWith("a", "Blurred Name")
  })

  it("empty input reverts to previous name on commit", () => {
    const { props } = renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerName-0"))
    const input = screen.getByTestId("layerNameInput-0")
    fireEvent.change(input, { target: { value: "   " } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(props.updateLayerName).toHaveBeenCalledWith("a", "Layer 1")
  })

  it("shows Active tag for the active layer", () => {
    renderPane({
      layers: [
        { id: "a", name: "Layer 1", color: "#fca5a5" },
        { id: "b", name: "Layer 2", color: "#93c5fd" },
      ],
      activeLayerId: "a",
    })
    expect(screen.getByTestId("layerActiveTag-0")).toHaveTextContent("Active")
    expect(screen.queryByTestId("layerActiveTag-1")).not.toBeInTheDocument()
  })

  it("does not show Active tag when no layer is active", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
      activeLayerId: null,
    })
    expect(screen.queryByTestId("layerActiveTag-0")).not.toBeInTheDocument()
  })

  it("highlights the active layer row with bg-accent", () => {
    renderPane({
      layers: [
        { id: "a", name: "Layer 1", color: "#fca5a5" },
        { id: "b", name: "Layer 2", color: "#93c5fd" },
      ],
      activeLayerId: "b",
    })
    const rows = screen.getByTestId("managementPane").querySelectorAll(".relative > div:first-child")
    expect(rows[0]).toHaveClass("hover:bg-accent/50")
    expect(rows[0]).not.toHaveClass("bg-accent")
    expect(rows[1]).toHaveClass("bg-accent")
  })

  it("calls setActiveLayer when clicking the spacer area on inactive layer", () => {
    const { props } = renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
      activeLayerId: null,
    })
    fireEvent.click(screen.getByTestId("layerRowSpacer-0"))
    expect(props.setActiveLayer).toHaveBeenCalledWith("a")
  })

  it("colour swatch has hover and cursor-pointer classes", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5", highlights: [] }],
    })
    const swatch = screen.getByTestId("layerSwatch-0")
    expect(swatch).toHaveClass("hover:border-black/30")
    expect(swatch).toHaveClass("cursor-pointer")
    expect(swatch).toHaveClass("transition-colors")
    expect(swatch).toHaveClass("border-2")
  })

  it("layer name swaps from div to input when entering edit mode", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    const label = screen.getByTestId("layerName-0")
    expect(label.tagName).toBe("DIV")
    expect(label).toHaveTextContent("Layer 1")
    fireEvent.click(label)
    expect(screen.queryByTestId("layerName-0")).not.toBeInTheDocument()
    const input = screen.getByTestId("layerNameInput-0")
    expect(input.tagName).toBe("INPUT")
    expect(input).toHaveClass("ring-border")
  })

  it("layer name does not have flex-1 class", () => {
    renderPane({
      layers: [{ id: "a", name: "Layer 1", color: "#fca5a5" }],
    })
    const nameSpan = screen.getByTestId("layerName-0")
    expect(nameSpan).not.toHaveClass("flex-1")
  })
})
