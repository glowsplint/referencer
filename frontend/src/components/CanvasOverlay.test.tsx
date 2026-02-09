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

function renderOverlay(overrides: Record<string, unknown> = {}) {
  const defaults = {
    layers: [],
    containerRef: createRef<HTMLDivElement>(),
    editorsRef: { current: new Map() },
    isLocked: false,
    isLayersOn: false,
  }
  const props = { ...defaults, ...overrides }
  return render(<CanvasOverlay {...props as any} />)
}

describe("CanvasOverlay", () => {
  it("renders a canvas element", () => {
    renderOverlay()
    expect(screen.getByTestId("canvasOverlay")).toBeInTheDocument()
  })

  it("has pointer-events-none class for click pass-through", () => {
    renderOverlay()
    const canvas = screen.getByTestId("canvasOverlay")
    expect(canvas.classList.contains("pointer-events-none")).toBe(true)
  })

  it("has absolute positioning and z-10", () => {
    renderOverlay()
    const canvas = screen.getByTestId("canvasOverlay")
    expect(canvas.classList.contains("absolute")).toBe(true)
    expect(canvas.classList.contains("z-10")).toBe(true)
  })

  it("observes the container for resize", () => {
    const div = document.createElement("div")
    const containerRef = { current: div }
    renderOverlay({ containerRef })
    expect(observeSpy).toHaveBeenCalledWith(div)
  })

  it("disconnects observer on unmount", () => {
    const { unmount } = renderOverlay()
    unmount()
    expect(disconnectSpy).toHaveBeenCalled()
  })
})
