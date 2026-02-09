import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { LayerRow } from "./LayerRow"
import { TAILWIND_300_COLORS } from "@/types/editor"

const defaultLayer = { id: "a", name: "Layer 1", color: "#fca5a5", highlights: [] as unknown[] }

function renderRow(overrides = {}) {
  const defaults = {
    layer: defaultLayer,
    index: 0,
    isActive: false,
    onSetActive: vi.fn(),
    onUpdateColor: vi.fn(),
    onUpdateName: vi.fn(),
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
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "a")
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
})
