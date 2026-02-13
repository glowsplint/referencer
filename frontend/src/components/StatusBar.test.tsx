import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatusBar } from "./StatusBar"

describe("StatusBar", () => {
  it("renders nothing when message is null", () => {
    const { container } = render(<StatusBar message={null} />)
    expect(container.firstChild).toBeNull()
  })

  it("renders info message text", () => {
    render(<StatusBar message={{ text: "Click a word", type: "info" }} />)
    expect(screen.getByTestId("status-bar")).toHaveTextContent("Click a word")
  })

  it("renders success message with check icon", () => {
    render(<StatusBar message={{ text: "Arrow created", type: "success" }} />)
    const bar = screen.getByTestId("status-bar")
    expect(bar).toHaveTextContent("Arrow created")
    // Check icon should be rendered (lucide CheckCircle2)
    expect(bar.querySelector("svg")).toBeInTheDocument()
  })

  it("does not render check icon for info messages", () => {
    render(<StatusBar message={{ text: "Some info", type: "info" }} />)
    const bar = screen.getByTestId("status-bar")
    expect(bar.querySelector("svg")).not.toBeInTheDocument()
  })

  it("renders ReactNode text content", () => {
    render(
      <StatusBar
        message={{ text: <span>Press <kbd>Enter</kbd></span>, type: "info" }}
      />
    )
    const bar = screen.getByTestId("status-bar")
    expect(bar).toHaveTextContent("Press Enter")
    expect(bar.querySelector("kbd")).toBeInTheDocument()
  })
})
