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

describe("ActionConsole", () => {
  it("renders nothing when not open", () => {
    render(<ActionConsole log={[]} isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByTestId("actionConsole")).not.toBeInTheDocument()
  })

  it("renders when open", () => {
    render(<ActionConsole log={[]} isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByTestId("actionConsole")).toBeInTheDocument()
    expect(screen.getByText("Action Console")).toBeInTheDocument()
  })

  it("shows empty state message when no log entries", () => {
    render(<ActionConsole log={[]} isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText("No actions recorded yet.")).toBeInTheDocument()
  })

  it("displays log entries", () => {
    const entries = [
      makeEntry({ type: "addLayer", description: "Created layer 'Layer 1'" }),
      makeEntry({ type: "addHighlight", description: "Highlighted 'hello' in Layer 1" }),
    ]
    render(<ActionConsole log={entries} isOpen={true} onClose={vi.fn()} />)

    expect(screen.getByText("Created layer 'Layer 1'")).toBeInTheDocument()
    expect(screen.getByText("Highlighted 'hello' in Layer 1")).toBeInTheDocument()
    expect(screen.getByText("[addLayer]")).toBeInTheDocument()
    expect(screen.getByText("[addHighlight]")).toBeInTheDocument()
  })

  it("shows undone entries with line-through class", () => {
    const entry = makeEntry({ undone: true, description: "Undone action" })
    render(<ActionConsole log={[entry]} isOpen={true} onClose={vi.fn()} />)

    const desc = screen.getByText("Undone action")
    expect(desc.parentElement).toHaveClass("line-through")
  })

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn()
    render(<ActionConsole log={[]} isOpen={true} onClose={onClose} />)

    fireEvent.click(screen.getByTestId("actionConsoleClose"))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
