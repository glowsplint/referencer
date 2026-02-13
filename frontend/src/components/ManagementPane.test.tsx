import { screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ManagementPane } from "./ManagementPane"
import { renderWithWorkspace } from "@/test/render-with-workspace"

const layerA = { id: "a", name: "Layer 1", color: "#fca5a5", visible: true, highlights: [] as unknown[], arrows: [] as unknown[] }
const layerB = { id: "b", name: "Layer 2", color: "#93c5fd", visible: true, highlights: [] as unknown[], arrows: [] as unknown[] }

function renderPane(overrides = {}) {
  return renderWithWorkspace(<ManagementPane />, overrides)
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
    const { workspace } = renderPane()
    fireEvent.click(screen.getByTestId("addLayerButton"))
    expect(workspace.addLayer).toHaveBeenCalled()
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
    const { workspace } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByText("Layer 1"))
    expect(workspace.setActiveLayer).toHaveBeenCalledWith("a")
  })

  it("calls updateLayerColor with layer id and new colour", () => {
    const { workspace } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByTestId("layerSwatch-0"))
    fireEvent.click(screen.getByTestId("colorOption-#93c5fd"))
    expect(workspace.updateLayerColor).toHaveBeenCalledWith("a", "#93c5fd")
  })

  it("calls updateLayerName with layer id and new name", () => {
    const { workspace } = renderPane({ layers: [layerA] })
    fireEvent.doubleClick(screen.getByTestId("layerName-0"))
    fireEvent.change(screen.getByTestId("layerNameInput-0"), { target: { value: "Renamed" } })
    fireEvent.keyDown(screen.getByTestId("layerNameInput-0"), { key: "Enter" })
    expect(workspace.updateLayerName).toHaveBeenCalledWith("a", "Renamed")
  })

  it("calls toggleLayerVisibility with layer id", () => {
    const { workspace } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByTestId("layerVisibility-0"))
    expect(workspace.toggleLayerVisibility).toHaveBeenCalledWith("a")
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
    const { workspace } = renderPane({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Passage 1", "Passage 2"] })
    fireEvent.click(screen.getByTestId("sectionVisibility-1"))
    expect(workspace.toggleSectionVisibility).toHaveBeenCalledWith(1)
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
    const { workspace } = renderPane({ layers: [layerA] })
    fireEvent.click(screen.getByTestId("toggleAllLayerVisibility"))
    expect(workspace.toggleAllLayerVisibility).toHaveBeenCalled()
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
    const { workspace } = renderPane({ layers: [layerA] })
    fireEvent.drop(screen.getByTestId("trashBin"), {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/x-layer-id" ? "a" : "",
      },
    })
    expect(workspace.removeLayer).toHaveBeenCalledWith("a")
  })

  it("calls removeEditor when a section is dropped on the trash bin", () => {
    const { workspace } = renderPane({ editorCount: 2 })
    fireEvent.drop(screen.getByTestId("trashBin"), {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/x-section-index" ? "1" : "",
      },
    })
    expect(workspace.removeEditor).toHaveBeenCalledWith(1)
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

  // --- Passage reordering ---

  it("calls reorderEditors with correct permutation when dragging passage 0 to position 2", () => {
    const { workspace } = renderPane({
      editorCount: 3,
      sectionVisibility: [true, true, true],
      sectionNames: ["A", "B", "C"],
    })
    const row0 = screen.getByTestId("passageRow-0")
    const row2 = screen.getByTestId("passageRow-2")
    fireEvent.dragStart(row0, {
      dataTransfer: { setData: () => {}, types: ["application/x-section-index"] },
    })
    fireEvent.drop(row2, {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/x-section-index" ? "0" : "",
        types: ["application/x-section-index"],
      },
    })
    // Moving index 0 to position 2: [B, C, A] → permutation [1, 2, 0]
    expect(workspace.reorderEditors).toHaveBeenCalledWith([1, 2, 0])
  })

  it("calls reorderEditors with correct permutation when dragging passage 2 to position 0", () => {
    const { workspace } = renderPane({
      editorCount: 3,
      sectionVisibility: [true, true, true],
      sectionNames: ["A", "B", "C"],
    })
    const row2 = screen.getByTestId("passageRow-2")
    const row0 = screen.getByTestId("passageRow-0")
    fireEvent.dragStart(row2, {
      dataTransfer: { setData: () => {}, types: ["application/x-section-index"] },
    })
    fireEvent.drop(row0, {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/x-section-index" ? "2" : "",
        types: ["application/x-section-index"],
      },
    })
    // Moving index 2 to position 0: [C, A, B] → permutation [2, 0, 1]
    expect(workspace.reorderEditors).toHaveBeenCalledWith([2, 0, 1])
  })

  it("does not call reorderEditors when dropping on same position", () => {
    const { workspace } = renderPane({
      editorCount: 3,
      sectionVisibility: [true, true, true],
      sectionNames: ["A", "B", "C"],
    })
    const row1 = screen.getByTestId("passageRow-1")
    fireEvent.drop(row1, {
      dataTransfer: {
        getData: (type: string) =>
          type === "application/x-section-index" ? "1" : "",
        types: ["application/x-section-index"],
      },
    })
    expect(workspace.reorderEditors).not.toHaveBeenCalled()
  })

  it("passage rows are not draggable with only 1 editor", () => {
    renderPane({ editorCount: 1, sectionVisibility: [true], sectionNames: ["A"] })
    const row = screen.getByTestId("passageRow-0")
    expect(row).not.toHaveAttribute("draggable", "true")
  })

  it("forwards sectionNames and updateSectionName to SectionList", () => {
    const { workspace } = renderPane({ sectionNames: ["Custom Name"] })
    expect(screen.getByText("Custom Name")).toBeInTheDocument()
    fireEvent.doubleClick(screen.getByTestId("passageName-0"))
    fireEvent.change(screen.getByTestId("passageNameInput-0"), { target: { value: "Renamed" } })
    fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Enter" })
    expect(workspace.updateSectionName).toHaveBeenCalledWith(0, "Renamed")
  })
})
