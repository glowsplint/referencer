import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SectionList } from "./SectionList"

describe("SectionList", () => {
  it("renders section rows with labels", () => {
    render(<SectionList editorCount={3} removeEditor={vi.fn()} />)
    expect(screen.getByText("Section 1")).toBeInTheDocument()
    expect(screen.getByText("Section 2")).toBeInTheDocument()
    expect(screen.getByText("Section 3")).toBeInTheDocument()
  })

  it("renders the Sections heading", () => {
    render(<SectionList editorCount={1} removeEditor={vi.fn()} />)
    expect(screen.getByText("Sections")).toBeInTheDocument()
  })

  it("calls removeEditor when remove button is clicked", () => {
    const removeEditor = vi.fn()
    render(<SectionList editorCount={2} removeEditor={removeEditor} />)
    fireEvent.click(screen.getByTestId("removeSection-1"))
    expect(removeEditor).toHaveBeenCalledWith(1)
  })

  it("hides remove buttons when only one section exists", () => {
    render(<SectionList editorCount={1} removeEditor={vi.fn()} />)
    expect(screen.queryByTestId("removeSection-0")).not.toBeInTheDocument()
  })

  it("shows remove buttons when multiple sections exist", () => {
    render(<SectionList editorCount={2} removeEditor={vi.fn()} />)
    expect(screen.getByTestId("removeSection-0")).toBeInTheDocument()
    expect(screen.getByTestId("removeSection-1")).toBeInTheDocument()
  })
})
