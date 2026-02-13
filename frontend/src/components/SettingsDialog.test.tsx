import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SettingsDialog } from "./SettingsDialog"

function renderDialog(overrides: Record<string, unknown> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    isDarkMode: false,
    toggleDarkMode: vi.fn(),
    showDrawingToasts: true,
    toggleShowDrawingToasts: vi.fn(),
    showCommentsToasts: true,
    toggleShowCommentsToasts: vi.fn(),
    ...overrides,
  }
  render(<SettingsDialog {...props} />)
  return props
}

describe("SettingsDialog", () => {
  it("renders dialog with title and description", () => {
    renderDialog()
    expect(screen.getByTestId("settingsDialog")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("Customize your workspace preferences.")).toBeInTheDocument()
  })

  it("renders all three setting rows", () => {
    renderDialog()
    expect(screen.getByText("Dark mode")).toBeInTheDocument()
    expect(screen.getByText("Drawing notifications")).toBeInTheDocument()
    expect(screen.getByText("Comments notifications")).toBeInTheDocument()
  })

  it("renders switches with correct checked state", () => {
    renderDialog({ isDarkMode: true, showDrawingToasts: false, showCommentsToasts: true })
    expect(screen.getByTestId("dark-mode-switch")).toHaveAttribute("data-state", "checked")
    expect(screen.getByTestId("drawing-notifications-switch")).toHaveAttribute("data-state", "unchecked")
    expect(screen.getByTestId("comments-notifications-switch")).toHaveAttribute("data-state", "checked")
  })

  it("calls toggleDarkMode when dark mode switch is clicked", () => {
    const props = renderDialog()
    fireEvent.click(screen.getByTestId("dark-mode-switch"))
    expect(props.toggleDarkMode).toHaveBeenCalledOnce()
  })

  it("calls toggleShowDrawingToasts when drawing switch is clicked", () => {
    const props = renderDialog()
    fireEvent.click(screen.getByTestId("drawing-notifications-switch"))
    expect(props.toggleShowDrawingToasts).toHaveBeenCalledOnce()
  })

  it("calls toggleShowCommentsToasts when comments switch is clicked", () => {
    const props = renderDialog()
    fireEvent.click(screen.getByTestId("comments-notifications-switch"))
    expect(props.toggleShowCommentsToasts).toHaveBeenCalledOnce()
  })

  it("does not render when open is false", () => {
    renderDialog({ open: false })
    expect(screen.queryByTestId("settingsDialog")).not.toBeInTheDocument()
  })
})
