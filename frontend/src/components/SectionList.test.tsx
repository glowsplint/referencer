import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SectionList } from "./SectionList"

function renderList(overrides = {}) {
  const defaults = {
    editorCount: 1,
    sectionVisibility: [true],
    sectionNames: ["Passage 1"],
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
    onUpdateName: vi.fn(),
    toggleSectionVisibility: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<SectionList {...props} />), props }
}

describe("SectionList", () => {
  it("renders passage rows with labels", () => {
    renderList({ editorCount: 3, sectionVisibility: [true, true, true], sectionNames: ["Passage 1", "Passage 2", "Passage 3"] })
    expect(screen.getByText("Passage 1")).toBeInTheDocument()
    expect(screen.getByText("Passage 2")).toBeInTheDocument()
    expect(screen.getByText("Passage 3")).toBeInTheDocument()
  })

  it("renders the Passages heading", () => {
    renderList()
    expect(screen.getByText("Passages")).toBeInTheDocument()
  })

  it("renders eye icon for each passage", () => {
    renderList({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Passage 1", "Passage 2"] })
    expect(screen.getByTestId("sectionVisibility-0")).toBeInTheDocument()
    expect(screen.getByTestId("sectionVisibility-1")).toBeInTheDocument()
  })

  it("calls toggleSectionVisibility when eye button is clicked", () => {
    const { props } = renderList({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Passage 1", "Passage 2"] })
    fireEvent.click(screen.getByTestId("sectionVisibility-1"))
    expect(props.toggleSectionVisibility).toHaveBeenCalledWith(1)
  })

  it("shows 'Hide passage' title when passage is visible", () => {
    renderList({ editorCount: 1, sectionVisibility: [true] })
    expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Hide passage")
  })

  it("shows 'Show passage' title when passage is hidden", () => {
    renderList({ editorCount: 1, sectionVisibility: [false] })
    expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Show passage")
  })

  it("passage rows are draggable when multiple passages exist", () => {
    renderList({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Passage 1", "Passage 2"] })
    const row = screen.getByTestId("passageName-0").closest("[draggable]")
    expect(row).toHaveAttribute("draggable", "true")
  })

  it("passage rows are not draggable when only one passage exists", () => {
    renderList()
    const row = screen.getByTestId("passageName-0").parentElement
    expect(row).not.toHaveAttribute("draggable", "true")
  })

  it("sets section index in dataTransfer on drag start", () => {
    renderList({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Passage 1", "Passage 2"] })
    const row = screen.getByTestId("passageName-1").closest("[draggable]")!
    const setData = vi.fn()
    fireEvent.dragStart(row, { dataTransfer: { setData } })
    expect(setData).toHaveBeenCalledWith("application/x-section-index", "1")
  })

  // --- Master passage visibility ---

  it("renders master passage visibility button", () => {
    renderList()
    expect(screen.getByTestId("toggleAllSectionVisibility")).toBeInTheDocument()
  })

  it("calls toggleAllSectionVisibility when master passage visibility button is clicked", () => {
    const { props } = renderList()
    fireEvent.click(screen.getByTestId("toggleAllSectionVisibility"))
    expect(props.toggleAllSectionVisibility).toHaveBeenCalled()
  })

  // --- Add passage button ---

  it("renders add passage button beside the Passages header", () => {
    renderList()
    expect(screen.getByTestId("addPassageButton")).toBeInTheDocument()
  })

  it("calls addEditor when add passage button is clicked", () => {
    const { props } = renderList()
    fireEvent.click(screen.getByTestId("addPassageButton"))
    expect(props.addEditor).toHaveBeenCalled()
  })

  // --- Inline editing ---

  it("renders custom passage names from props", () => {
    renderList({ editorCount: 2, sectionVisibility: [true, true], sectionNames: ["Intro", "Body"] })
    expect(screen.getByText("Intro")).toBeInTheDocument()
    expect(screen.getByText("Body")).toBeInTheDocument()
  })

  it("double-click enters edit mode", () => {
    renderList()
    fireEvent.doubleClick(screen.getByTestId("passageName-0"))
    expect(screen.getByTestId("passageNameInput-0")).toBeInTheDocument()
    expect(screen.getByTestId("passageNameInput-0")).toHaveValue("Passage 1")
  })

  it("Enter commits new name", () => {
    const { props } = renderList()
    fireEvent.doubleClick(screen.getByTestId("passageName-0"))
    fireEvent.change(screen.getByTestId("passageNameInput-0"), { target: { value: "Renamed" } })
    fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Enter" })
    expect(props.onUpdateName).toHaveBeenCalledWith(0, "Renamed")
  })

  it("Escape cancels edit", () => {
    const { props } = renderList()
    fireEvent.doubleClick(screen.getByTestId("passageName-0"))
    fireEvent.change(screen.getByTestId("passageNameInput-0"), { target: { value: "Renamed" } })
    fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Escape" })
    expect(props.onUpdateName).not.toHaveBeenCalled()
    expect(screen.getByTestId("passageName-0")).toBeInTheDocument()
  })

  it("blur commits new name", () => {
    const { props } = renderList()
    fireEvent.doubleClick(screen.getByTestId("passageName-0"))
    fireEvent.change(screen.getByTestId("passageNameInput-0"), { target: { value: "Blurred" } })
    fireEvent.blur(screen.getByTestId("passageNameInput-0"))
    expect(props.onUpdateName).toHaveBeenCalledWith(0, "Blurred")
  })

  it("empty name reverts to original", () => {
    const { props } = renderList()
    fireEvent.doubleClick(screen.getByTestId("passageName-0"))
    fireEvent.change(screen.getByTestId("passageNameInput-0"), { target: { value: "   " } })
    fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Enter" })
    expect(props.onUpdateName).toHaveBeenCalledWith(0, "Passage 1")
  })
})
