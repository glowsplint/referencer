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
    editorCount: 1,
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

  it("does not reattach scroll listeners when layers change", () => {
    const wrapper = document.createElement("div")
    wrapper.className = "simple-editor-wrapper"
    const container = document.createElement("div")
    container.appendChild(wrapper)
    const containerRef = { current: container }

    const addSpy = vi.spyOn(wrapper, "addEventListener")
    const removeSpy = vi.spyOn(wrapper, "removeEventListener")

    const layer1 = { id: "a", color: "#fca5a5", name: "L1", visible: true, highlights: [] }
    const layer2 = { id: "b", color: "#93c5fd", name: "L2", visible: true, highlights: [] }

    const { rerender } = render(
      <CanvasOverlay
        layers={[layer1] as any}
        containerRef={containerRef as any}
        editorsRef={{ current: new Map() } as any}
        editorCount={1}
        isLocked={false}
        isLayersOn={false}
      />
    )

    const scrollAddCount = addSpy.mock.calls.filter(([e]) => e === "scroll").length
    const scrollRemoveCount = removeSpy.mock.calls.filter(([e]) => e === "scroll").length

    rerender(
      <CanvasOverlay
        layers={[layer1, layer2] as any}
        containerRef={containerRef as any}
        editorsRef={{ current: new Map() } as any}
        editorCount={1}
        isLocked={false}
        isLayersOn={false}
      />
    )

    // Scroll listeners should NOT have been removed and re-added
    expect(addSpy.mock.calls.filter(([e]) => e === "scroll").length).toBe(scrollAddCount)
    expect(removeSpy.mock.calls.filter(([e]) => e === "scroll").length).toBe(scrollRemoveCount)
  })
})
