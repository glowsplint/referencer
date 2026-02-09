import { screen, fireEvent } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ButtonPane } from "./ButtonPane"
import { renderWithWorkspace } from "@/test/render-with-workspace"

function renderButtonPane(overrides = {}) {
  return renderWithWorkspace(<ButtonPane />, overrides)
}

describe("ButtonPane", () => {
  it("renders all toggle buttons", () => {
    renderButtonPane()
    expect(screen.getByTestId("menuButton")).toBeInTheDocument()
    expect(screen.getByTestId("darkModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("editorLayoutButton")).toBeInTheDocument()
    expect(screen.getByTestId("painterModeButton")).toBeInTheDocument()
    expect(screen.getByTestId("lockButton")).toBeInTheDocument()
  })

  it("calls toggleManagementPane when menu button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("menuButton"))
    expect(workspace.toggleManagementPane).toHaveBeenCalledOnce()
  })

  it("calls toggleDarkMode when dark mode button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("darkModeButton"))
    expect(workspace.toggleDarkMode).toHaveBeenCalledOnce()
  })

  it("calls toggleMultipleRowsLayout when layout button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("editorLayoutButton"))
    expect(workspace.toggleMultipleRowsLayout).toHaveBeenCalledOnce()
  })

  it("calls togglePainterMode when painter button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("painterModeButton"))
    expect(workspace.togglePainterMode).toHaveBeenCalledOnce()
  })

  it("calls toggleLocked when lock button is clicked", () => {
    const { workspace } = renderButtonPane()
    fireEvent.click(screen.getByTestId("lockButton"))
    expect(workspace.toggleLocked).toHaveBeenCalledOnce()
  })
})
