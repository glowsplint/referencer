import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ArrowOverlay } from "./ArrowOverlay"
import type { Layer, DrawingState, ActiveTool } from "@/types/editor"
import type { Editor } from "@tiptap/react"

// Mock getWordCenter and getWordRect to return deterministic positions
vi.mock("@/lib/tiptap/nearest-word", () => ({
  getWordCenter: vi.fn((word: { editorIndex: number; from: number }) => {
    // Return predictable positions based on from offset
    return { cx: word.from * 10, cy: word.editorIndex * 50 + 25 }
  }),
  getWordRect: vi.fn((word: { editorIndex: number; from: number; to: number }) => {
    return {
      x: word.from * 10,
      y: word.editorIndex * 50 + 15,
      width: (word.to - word.from) * 10,
      height: 20,
    }
  }),
}))

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    ...overrides,
  }
}

function createDefaultProps(overrides: Record<string, unknown> = {}) {
  const containerEl = document.createElement("div")
  containerEl.getBoundingClientRect = () => ({
    x: 0, y: 0, width: 800, height: 600,
    top: 0, right: 800, bottom: 600, left: 0,
    toJSON: () => {},
  })

  return {
    layers: [] as Layer[],
    drawingState: null as DrawingState | null,
    drawingColor: null as string | null,
    editorsRef: { current: new Map() } as React.RefObject<Map<number, Editor>>,
    containerRef: { current: containerEl } as React.RefObject<HTMLDivElement | null>,
    removeArrow: vi.fn(),
    activeTool: "selection" as ActiveTool,
    sectionVisibility: [true, true, true],
    isDarkMode: false,
    isLocked: false,
    ...overrides,
  }
}

describe("ArrowOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders SVG with correct testid", () => {
    render(<ArrowOverlay {...createDefaultProps()} />)
    expect(screen.getByTestId("arrow-overlay")).toBeInTheDocument()
  })

  it("renders lines for visible layer arrows", () => {
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />)

    const lines = screen.getAllByTestId("arrow-line")
    expect(lines).toHaveLength(1)
  })

  it("renders multiple arrows from multiple layers", () => {
    const layer1 = createLayer({
      id: "l1",
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    const layer2 = createLayer({
      id: "l2",
      color: "#93c5fd",
      arrows: [
        {
          id: "a2",
          from: { editorIndex: 0, from: 20, to: 25, text: "foo" },
          to: { editorIndex: 1, from: 1, to: 4, text: "bar" },
        },
      ],
    })

    render(<ArrowOverlay {...createDefaultProps({ layers: [layer1, layer2] })} />)
    expect(screen.getAllByTestId("arrow-line")).toHaveLength(2)
  })

  it("hides lines for invisible layers", () => {
    const layer = createLayer({
      visible: false,
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />)
    expect(screen.queryByTestId("arrow-line")).not.toBeInTheDocument()
  })

  it("renders dashed preview line from drawingState", () => {
    const drawingState: DrawingState = {
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 10, to: 15, text: "world" },
    }
    render(
      <ArrowOverlay
        {...createDefaultProps({
          drawingState,
          drawingColor: "#fca5a5",
        })}
      />
    )

    const preview = screen.getByTestId("preview-arrow")
    expect(preview).toBeInTheDocument()
    expect(preview.getAttribute("stroke-dasharray")).toBe("6 4")
  })

  it("does not render preview when anchor === cursor", () => {
    const drawingState: DrawingState = {
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    }
    render(
      <ArrowOverlay
        {...createDefaultProps({
          drawingState,
          drawingColor: "#fca5a5",
        })}
      />
    )

    expect(screen.queryByTestId("preview-arrow")).not.toBeInTheDocument()
  })

  it("does not render preview when drawingColor is null", () => {
    const drawingState: DrawingState = {
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 10, to: 15, text: "world" },
    }
    render(
      <ArrowOverlay
        {...createDefaultProps({
          drawingState,
          drawingColor: null,
        })}
      />
    )

    expect(screen.queryByTestId("preview-arrow")).not.toBeInTheDocument()
  })

  it("hides arrows when an endpoint's section is hidden", () => {
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 1, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(
      <ArrowOverlay
        {...createDefaultProps({
          layers: [layer],
          sectionVisibility: [true, false, true],
        })}
      />
    )
    expect(screen.queryByTestId("arrow-line")).not.toBeInTheDocument()
  })

  it("click on arrow line triggers removeArrow callback", () => {
    const removeArrow = vi.fn()
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(
      <ArrowOverlay
        {...createDefaultProps({ layers: [layer], removeArrow })}
      />
    )

    fireEvent.click(screen.getByTestId("arrow-hit-area"))
    expect(removeArrow).toHaveBeenCalledWith("layer-1", "a1")
  })

  it("recalculates positions on scroll within container", async () => {
    const { getWordCenter } = vi.mocked(
      await import("@/lib/tiptap/nearest-word")
    )
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    const props = createDefaultProps({ layers: [layer] })
    render(<ArrowOverlay {...props} />)

    const callsBefore = getWordCenter.mock.calls.length

    // Dispatch scroll on the container (capture listeners fire on target too)
    await act(async () => {
      props.containerRef.current!.dispatchEvent(
        new Event("scroll", { bubbles: false })
      )
      // Wait for requestAnimationFrame to flush
      await new Promise((r) => requestAnimationFrame(r))
    })

    expect(getWordCenter.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it("renders endpoint rects when isLocked", () => {
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(
      <ArrowOverlay
        {...createDefaultProps({ layers: [layer], isLocked: true })}
      />
    )

    const rects = screen.getAllByTestId("arrow-endpoint-rect")
    expect(rects).toHaveLength(2)
  })

  it("does not render endpoint rects when not locked", () => {
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(
      <ArrowOverlay
        {...createDefaultProps({ layers: [layer], isLocked: false })}
      />
    )

    expect(screen.queryByTestId("arrow-endpoint-rect")).not.toBeInTheDocument()
  })

  it("SVG overlay uses mix-blend-mode multiply in light mode", () => {
    render(
      <ArrowOverlay
        {...createDefaultProps({ isDarkMode: false })}
      />
    )

    const svg = screen.getByTestId("arrow-overlay")
    expect(svg).toHaveStyle({ mixBlendMode: "multiply" })
  })

  it("SVG overlay uses mix-blend-mode screen in dark mode", () => {
    render(
      <ArrowOverlay
        {...createDefaultProps({ isDarkMode: true })}
      />
    )

    const svg = screen.getByTestId("arrow-overlay")
    expect(svg).toHaveStyle({ mixBlendMode: "screen" })
  })

  it("endpoint rects, arrow line, and arrowhead share same base color", () => {
    const layerColor = "#fca5a5"
    const layer = createLayer({
      color: layerColor,
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(
      <ArrowOverlay
        {...createDefaultProps({ layers: [layer], isLocked: true })}
      />
    )

    const rects = screen.getAllByTestId("arrow-endpoint-rect")
    for (const rect of rects) {
      expect(rect.getAttribute("fill")).toBe(layerColor)
    }

    const line = screen.getByTestId("arrow-line")
    expect(line.getAttribute("stroke")).toBe(layerColor)

    const marker = document.getElementById("arrowhead-a1")
    const polygon = marker?.querySelector("polygon")
    expect(polygon?.getAttribute("fill")).toBe(layerColor)
  })

  it("arrow hit areas have pointer-events none when arrow tool is active", () => {
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(
      <ArrowOverlay
        {...createDefaultProps({ layers: [layer], activeTool: "arrow" })}
      />
    )

    const hitArea = screen.getByTestId("arrow-hit-area")
    expect(hitArea).toHaveStyle({ pointerEvents: "none" })
  })

  it("interaction layer SVG has no mix-blend-mode", () => {
    render(<ArrowOverlay {...createDefaultProps()} />)

    const interactionLayer = screen.getByTestId("arrow-interaction-layer")
    expect(interactionLayer).not.toHaveStyle({ mixBlendMode: "multiply" })
    expect(interactionLayer).not.toHaveStyle({ mixBlendMode: "screen" })
  })

  it("hit areas are in the interaction layer, not the blended visual layer", () => {
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />)

    const hitArea = screen.getByTestId("arrow-hit-area")
    const interactionLayer = screen.getByTestId("arrow-interaction-layer")
    expect(interactionLayer.contains(hitArea)).toBe(true)

    const visualLayer = screen.getByTestId("arrow-overlay")
    expect(visualLayer.contains(hitArea)).toBe(false)
  })

  it("shows X icon on hover and hides it on mouse leave", () => {
    const layer = createLayer({
      arrows: [
        {
          id: "a1",
          from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
          to: { editorIndex: 0, from: 10, to: 15, text: "world" },
        },
      ],
    })
    render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />)

    const hitArea = screen.getByTestId("arrow-hit-area")

    // No X icon initially
    const interactionLayer = screen.getByTestId("arrow-interaction-layer")
    expect(interactionLayer.querySelector("circle")).not.toBeInTheDocument()

    // Hover shows X icon
    fireEvent.mouseEnter(hitArea)
    const circle = interactionLayer.querySelector("circle")
    expect(circle).toBeInTheDocument()

    // Mouse leave hides X icon
    fireEvent.mouseLeave(hitArea)
    expect(interactionLayer.querySelector("circle")).not.toBeInTheDocument()
  })
})
