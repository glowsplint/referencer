import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ManagementPane } from "./ManagementPane"
import { TAILWIND_300_COLORS } from "@/types/editor"

function renderPane(overrides = {}) {
  const defaults = {
    layers: [] as { id: string; color: string }[],
    editorCount: 1,
    removeLayer: vi.fn(),
    updateLayerColor: vi.fn(),
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
        { id: "a", color: "#fca5a5" },
        { id: "b", color: "#93c5fd" },
      ],
    })
    expect(screen.getByText("Layer 1")).toBeInTheDocument()
    expect(screen.getByText("Layer 2")).toBeInTheDocument()
  })

  it("renders colour swatches for each layer", () => {
    renderPane({
      layers: [{ id: "a", color: "#fca5a5" }],
    })
    const swatch = screen.getByTestId("layerSwatch-0")
    expect(swatch.style.backgroundColor).toBe("rgb(252, 165, 165)")
  })

  it("calls removeLayer when X button is clicked", () => {
    const { props } = renderPane({
      layers: [{ id: "a", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("removeLayer-0"))
    expect(props.removeLayer).toHaveBeenCalledWith("a")
  })

  it("opens colour picker when swatch is clicked", () => {
    renderPane({
      layers: [{ id: "a", color: "#fca5a5" }],
    })
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument()
  })

  it("closes colour picker when swatch is clicked again", () => {
    renderPane({
      layers: [{ id: "a", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument()
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument()
  })

  it("calls updateLayerColor when a colour is selected", () => {
    const { props } = renderPane({
      layers: [{ id: "a", color: "#fca5a5" }],
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
      layers: [{ id: "a", color: "#fca5a5" }],
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
      layers: [{ id: "a", color: "#fca5a5" }],
    })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    for (const color of TAILWIND_300_COLORS) {
      expect(screen.getByTestId(`colorOption-${color}`)).toBeInTheDocument()
    }
  })
})
