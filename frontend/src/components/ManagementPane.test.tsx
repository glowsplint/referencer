import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ManagementPane } from "./ManagementPane"

const layerA = { id: "a", name: "Layer 1", color: "#fca5a5", visible: true, highlights: [] as unknown[] }
const layerB = { id: "b", name: "Layer 2", color: "#93c5fd", visible: true, highlights: [] as unknown[] }

function renderPane(overrides = {}) {
  const defaults = {
    layers: [] as typeof layerA[],
    activeLayerId: null as string | null,
    editorCount: 1,
    sectionVisibility: [true],
    sectionNames: ["Passage 1"],
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    setActiveLayer: vi.fn(),
    updateLayerColor: vi.fn(),
    updateLayerName: vi.fn(),
    toggleLayerVisibility: vi.fn(),
    toggleAllLayerVisibility: vi.fn(),
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
    updateSectionName: vi.fn(),
    toggleSectionVisibility: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<ManagementPane {...props} />), props }
}

describe("ManagementPane", () => {
  it("renders the management pane", () => {
    renderPane()
    expect(screen.getByTestId("managementPane")).toBeInTheDocument()
  })

  it("renders add layer button beside the Layers header", () => {
    renderPane()
    expect(screen.getByTestId("addLayerButton")).toBeInTheDocument()
  })

  it("calls addLayer when add layer button is clicked", () => {
    const { props } = renderPane()
    fireEvent.click(screen.getByTestId("addLayerButton"))
    expect(props.addLayer).toHaveBeenCalled()
  })

  it("renders a LayerRow for each layer", () => {
    renderPane({ layers: [layerA, layerB] })
    expect(screen.getByText("Layer 1")).toBeInTheDocument()
    expect(screen.getByText("Layer 2")).toBeInTheDocument()
  })

  it("passes isActive=true only to the active layer", () => {
    renderPane({ layers: [layerA, layerB], activeLayerId: "b" })
    expect(screen.queryByTestId("layerActiveTag-0")).not.toBeInTheDocument()
    expect(screen.getByTestId("layerActiveTag-1")).toHaveTextContent("Active")
  })

  it("calls setActiveLayer with layer id when clicking a layer row", () => {
    const { props } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByText("Layer 1"))
    expect(props.setActiveLayer).toHaveBeenCalledWith("a")
  })

  it("calls updateLayerColor with layer id and new colour", () => {
    const { props } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    fireEvent.click(screen.getByTestId("colorOption-#93c5fd"))
    expect(props.updateLayerColor).toHaveBeenCalledWith("a", "#93c5fd")
  })

  it("calls updateLayerName with layer id and new name", () => {
    const { props } = renderPane({ layers: [layerA] })
    fireEvent.doubleClick(screen.getByTestId("layerName-0"))
    fireEvent.change(screen.getByTestId("layerNameInput-0"), { target: { value: "Renamed" } })
    fireEvent.keyDown(screen.getByTestId("layerNameInput-0"), { key: "Enter" })
    expect(props.updateLayerName).toHaveBeenCalledWith("a", "Renamed")
  })

  it("calls toggleLayerVisibility with layer id", () => {
    const { props } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByTestId("layerVisibility-0"))
    expect(props.toggleLayerVisibility).toHaveBeenCalledWith("a")
  })

  it("renders the Passages heading via SectionList", () => {
    renderPane()
    expect(screen.getByText("Passages")).toBeInTheDocument()
  })

  it("renders passage rows matching editorCount", () => {
    renderPane({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Passage 1", "Passage 2"] })
    expect(screen.getByText("Passage 1")).toBeInTheDocument()
    expect(screen.getByText("Passage 2")).toBeInTheDocument()
  })

  it("calls toggleSectionVisibility when passage eye button is clicked", () => {
    const { props } = renderPane({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Passage 1", "Passage 2"] })
    fireEvent.click(screen.getByTestId("sectionVisibility-1"))
    expect(props.toggleSectionVisibility).toHaveBeenCalledWith(1)
  })

  // --- Master layer visibility ---

  it("renders master layer visibility button when layers exist", () => {
    renderPane({ layers: [layerA] })
    expect(screen.getByTestId("toggleAllLayerVisibility")).toBeInTheDocument()
  })

  it("renders master layer visibility button even when no layers", () => {
    renderPane()
    expect(screen.getByTestId("toggleAllLayerVisibility")).toBeInTheDocument()
  })

  it("calls toggleAllLayerVisibility when master layer visibility button is clicked", () => {
    const { props } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByTestId("toggleAllLayerVisibility"))
    expect(props.toggleAllLayerVisibility).toHaveBeenCalled()
  })

  // --- Trash bin ---

  it("renders trash bin when layers exist", () => {
    renderPane({ layers: [layerA] })
    expect(screen.getByTestId("trashBin")).toBeInTheDocument()
  })

  it("renders trash bin when multiple sections exist", () => {
    renderPane({ editorCount: 2 })
    expect(screen.getByTestId("trashBin")).toBeInTheDocument()
  })

  it("does not render trash bin when no layers and one section", () => {
    renderPane()
    expect(screen.queryByTestId("trashBin")).not.toBeInTheDocument()
  })

  it("calls removeLayer when a layer is dropped on the trash bin", () => {
    const { props } = renderPane({ layers: [layerA] })
    fireEvent.drop(screen.getByTestId("trashBin"), {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/x-layer-id" ? "a" : "",
      },
    })
    expect(props.removeLayer).toHaveBeenCalledWith("a")
  })

  it("calls removeEditor when a section is dropped on the trash bin", () => {
    const { props } = renderPane({ editorCount: 2 })
    fireEvent.drop(screen.getByTestId("trashBin"), {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/x-section-index" ? "1" : "",
      },
    })
    expect(props.removeEditor).toHaveBeenCalledWith(1)
  })

  it("shows destructive styling during dragover", () => {
    renderPane({ layers: [layerA] })
    const bin = screen.getByTestId("trashBin")
    expect(bin).toHaveClass("border-muted-foreground/30")
    fireEvent.dragEnter(bin)
    expect(bin).toHaveClass("border-destructive")
  })

  it("reverts styling after dragleave", () => {
    renderPane({ layers: [layerA] })
    const bin = screen.getByTestId("trashBin")
    fireEvent.dragEnter(bin)
    expect(bin).toHaveClass("border-destructive")
    fireEvent.dragLeave(bin)
    expect(bin).toHaveClass("border-muted-foreground/30")
  })

  // --- Section name editing ---

  it("forwards sectionNames and updateSectionName to SectionList", () => {
    const { props } = renderPane({ sectionNames: ["Custom Name"] })
    expect(screen.getByText("Custom Name")).toBeInTheDocument()
    fireEvent.doubleClick(screen.getByTestId("passageName-0"))
    fireEvent.change(screen.getByTestId("passageNameInput-0"), { target: { value: "Renamed" } })
    fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Enter" })
    expect(props.updateSectionName).toHaveBeenCalledWith(0, "Renamed")
  })
})
