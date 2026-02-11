import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ActionConsole } from "./ActionConsole"
import type { ActionEntry } from "@/types/editor"

function makeEntry(overrides: Partial<ActionEntry> = {}): ActionEntry {
  return {
    id: crypto.randomUUID(),
    type: "addLayer",
    description: "Created layer 'Layer 1'",
    timestamp: Date.now(),
    undone: false,
    ...overrides,
  }
}

const defaultProps = {
  log: [] as ActionEntry[],
  isOpen: true,
  onClose: vi.fn(),
  height: 192,
  onHeightChange: vi.fn(),
}

describe("ActionConsole", () => {
  it("renders nothing when not open", () => {
    render(<ActionConsole {...defaultProps} isOpen={false} />)
    expect(screen.queryByTestId("actionConsole")).not.toBeInTheDocument()
  })

  it("renders when open", () => {
    render(<ActionConsole {...defaultProps} />)
    expect(screen.getByTestId("actionConsole")).toBeInTheDocument()
    expect(screen.getByText("Action Console")).toBeInTheDocument()
  })

  it("shows empty state message when no log entries", () => {
    render(<ActionConsole {...defaultProps} />)
    expect(screen.getByText("No actions recorded yet.")).toBeInTheDocument()
  })

  it("displays log entries", () => {
    const entries = [
      makeEntry({ type: "addLayer", description: "Created layer 'Layer 1'" }),
      makeEntry({ type: "addHighlight", description: "Highlighted 'hello' in Layer 1" }),
    ]
    render(<ActionConsole {...defaultProps} log={entries} />)

    expect(screen.getByText("Created layer 'Layer 1'")).toBeInTheDocument()
    expect(screen.getByText("Highlighted 'hello' in Layer 1")).toBeInTheDocument()
    expect(screen.getByText("[addLayer]")).toBeInTheDocument()
    expect(screen.getByText("[addHighlight]")).toBeInTheDocument()
  })

  it("shows undone entries with line-through class", () => {
    const entry = makeEntry({ undone: true, description: "Undone action" })
    render(<ActionConsole {...defaultProps} log={[entry]} />)

    const desc = screen.getByText("Undone action")
    expect(desc.parentElement).toHaveClass("line-through")
  })

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn()
    render(<ActionConsole {...defaultProps} onClose={onClose} />)

    fireEvent.click(screen.getByTestId("actionConsoleClose"))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("renders the drag handle", () => {
    render(<ActionConsole {...defaultProps} />)
    expect(screen.getByTestId("consoleDragHandle")).toBeInTheDocument()
  })

  it("applies the height prop as inline style", () => {
    render(<ActionConsole {...defaultProps} height={300} />)
    const console = screen.getByTestId("actionConsole")
    expect(console.style.height).toBe("300px")
  })

  it("drag handle fires onHeightChange on mousemove", () => {
    const onHeightChange = vi.fn()
    render(<ActionConsole {...defaultProps} height={200} onHeightChange={onHeightChange} />)

    const handle = screen.getByTestId("consoleDragHandle")

    fireEvent.mouseDown(handle, { clientY: 500 })
    fireEvent.mouseMove(document, { clientY: 450 })

    expect(onHeightChange).toHaveBeenCalledWith(250)

    fireEvent.mouseUp(document)
  })

  it("drag clamps height to minimum 80px", () => {
    const onHeightChange = vi.fn()
    render(<ActionConsole {...defaultProps} height={100} onHeightChange={onHeightChange} />)

    const handle = screen.getByTestId("consoleDragHandle")

    fireEvent.mouseDown(handle, { clientY: 500 })
    fireEvent.mouseMove(document, { clientY: 700 })

    expect(onHeightChange).toHaveBeenCalledWith(80)

    fireEvent.mouseUp(document)
  })

  it("drag clamps height to maximum 600px", () => {
    const onHeightChange = vi.fn()
    render(<ActionConsole {...defaultProps} height={500} onHeightChange={onHeightChange} />)

    const handle = screen.getByTestId("consoleDragHandle")

    fireEvent.mouseDown(handle, { clientY: 500 })
    fireEvent.mouseMove(document, { clientY: 300 })

    expect(onHeightChange).toHaveBeenCalledWith(600)

    fireEvent.mouseUp(document)
  })
})
