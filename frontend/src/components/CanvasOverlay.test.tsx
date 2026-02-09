import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createRef } from "react"
import { CanvasOverlay } from "./CanvasOverlay"

let observeSpy: ReturnType<typeof vi.fn>
let disconnectSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  observeSpy = vi.fn()
  disconnectSpy = vi.fn()
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = observeSpy
      unobserve = vi.fn()
      disconnect = disconnectSpy
    },
  )
})

describe("CanvasOverlay", () => {
  it("renders a canvas element", () => {
    const containerRef = createRef<HTMLDivElement>()
    render(<CanvasOverlay layers={[]} containerRef={containerRef} />)
    expect(screen.getByTestId("canvasOverlay")).toBeInTheDocument()
  })

  it("has pointer-events-none class for click pass-through", () => {
    const containerRef = createRef<HTMLDivElement>()
    render(<CanvasOverlay layers={[]} containerRef={containerRef} />)
    const canvas = screen.getByTestId("canvasOverlay")
    expect(canvas.classList.contains("pointer-events-none")).toBe(true)
  })

  it("has absolute positioning and z-10", () => {
    const containerRef = createRef<HTMLDivElement>()
    render(<CanvasOverlay layers={[]} containerRef={containerRef} />)
    const canvas = screen.getByTestId("canvasOverlay")
    expect(canvas.classList.contains("absolute")).toBe(true)
    expect(canvas.classList.contains("z-10")).toBe(true)
  })

  it("observes the container for resize", () => {
    const div = document.createElement("div")
    const containerRef = { current: div }
    render(<CanvasOverlay layers={[]} containerRef={containerRef} />)
    expect(observeSpy).toHaveBeenCalledWith(div)
  })

  it("disconnects observer on unmount", () => {
    const containerRef = createRef<HTMLDivElement>()
    const { unmount } = render(
      <CanvasOverlay layers={[]} containerRef={containerRef} />,
    )
    unmount()
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
