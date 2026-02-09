import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SectionList } from "./SectionList"

function renderList(overrides = {}) {
  const defaults = {
    editorCount: 1,
    sectionVisibility: [true],
    removeEditor: vi.fn(),
    toggleSectionVisibility: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<SectionList {...props} />), props }
}

describe("SectionList", () => {
  it("renders section rows with labels", () => {
    renderList({ editorCount: 3, sectionVisibility: [true, true, true] })
    expect(screen.getByText("Section 1")).toBeInTheDocument()
    expect(screen.getByText("Section 2")).toBeInTheDocument()
    expect(screen.getByText("Section 3")).toBeInTheDocument()
  })

  it("renders the Sections heading", () => {
    renderList()
    expect(screen.getByText("Sections")).toBeInTheDocument()
  })

  it("renders eye icon for each section", () => {
    renderList({ editorCount: 2, sectionVisibility: [true, true] })
    expect(screen.getByTestId("sectionVisibility-0")).toBeInTheDocument()
    expect(screen.getByTestId("sectionVisibility-1")).toBeInTheDocument()
  })

  it("calls toggleSectionVisibility when eye button is clicked", () => {
    const { props } = renderList({ editorCount: 2, sectionVisibility: [true, true] })
    fireEvent.click(screen.getByTestId("sectionVisibility-1"))
    expect(props.toggleSectionVisibility).toHaveBeenCalledWith(1)
  })

  it("shows 'Hide section' title when section is visible", () => {
    renderList({ editorCount: 1, sectionVisibility: [true] })
    expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Hide section")
  })

  it("shows 'Show section' title when section is hidden", () => {
    renderList({ editorCount: 1, sectionVisibility: [false] })
    expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Show section")
  })

  it("section rows are draggable when multiple sections exist", () => {
    renderList({ editorCount: 2, sectionVisibility: [true, true] })
    const row = screen.getByText("Section 1").closest("[draggable]")
    expect(row).toHaveAttribute("draggable", "true")
  })

  it("section rows are not draggable when only one section exists", () => {
    renderList()
    const row = screen.getByText("Section 1").parentElement
    expect(row).not.toHaveAttribute("draggable", "true")
  })

  it("sets section index in dataTransfer on drag start", () => {
    renderList({ editorCount: 2, sectionVisibility: [true, true] })
    const row = screen.getByText("Section 2").closest("[draggable]")!
    const setData = vi.fn()
    fireEvent.dragStart(row, { dataTransfer: { setData } })
    expect(setData).toHaveBeenCalledWith("application/x-section-index", "1")
  })
})
