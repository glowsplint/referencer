import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ArrowOverlay } from "./ArrowOverlay"
import type { Layer, DrawingState } from "@/types/editor"
import type { Editor } from "@tiptap/react"

// Mock getWordCenter to return deterministic positions
vi.mock("@/lib/tiptap/nearest-word", () => ({
  getWordCenter: vi.fn((word: { editorIndex: number; from: number }) => {
    // Return predictable positions based on from offset
    return { cx: word.from * 10, cy: word.editorIndex * 50 + 25 }
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
    sectionVisibility: [true, true, true],
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

    fireEvent.click(screen.getByTestId("arrow-line"))
    expect(removeArrow).toHaveBeenCalledWith("layer-1", "a1")
  })
})
