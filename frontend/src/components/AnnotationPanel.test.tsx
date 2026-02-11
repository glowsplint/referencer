import { render } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AnnotationPanel } from "./AnnotationPanel"
import type { Layer, EditingAnnotation } from "@/types/editor"
import type { Editor } from "@tiptap/react"
import { useAllHighlightPositions } from "@/hooks/use-all-highlight-positions"

// Mock hooks and libs
vi.mock("@/hooks/use-all-highlight-positions", () => ({
  useAllHighlightPositions: vi.fn(() => [
    { highlightId: "h1", layerId: "layer-1", editorIndex: 0, top: 40, rightEdge: 300 },
  ]),
}))

vi.mock("@/lib/resolve-annotation-overlaps", () => ({
  resolveAnnotationOverlaps: vi.fn((positions: { id: string; desiredTop: number }[]) =>
    positions.map((p) => ({ id: p.id, top: p.desiredTop }))
  ),
}))

vi.mock("@/lib/color", () => ({
  blendWithBackground: vi.fn((hex: string) => hex),
}))

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [
      {
        id: "h1",
        editorIndex: 0,
        from: 0,
        to: 5,
        text: "hello",
        annotation: "Test note",
      },
    ],
    arrows: [],
    ...overrides,
  }
}

function createProps(overrides: Record<string, unknown> = {}) {
  const containerEl = document.createElement("div")
  Object.defineProperty(containerEl, "offsetWidth", { value: 800 })

  return {
    layers: [createLayer()],
    editorsRef: { current: new Map([[0, {} as Editor]]) } as React.RefObject<Map<number, Editor>>,
    containerRef: { current: containerEl } as React.RefObject<HTMLDivElement | null>,
    editingAnnotation: null as EditingAnnotation | null,
    onAnnotationChange: vi.fn(),
    onAnnotationBlur: vi.fn(),
    onAnnotationClick: vi.fn(),
    isDarkMode: false,
    sectionVisibility: [true, true, true],
    ...overrides,
  }
}

describe("AnnotationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAllHighlightPositions).mockReturnValue([
      { highlightId: "h1", layerId: "layer-1", editorIndex: 0, top: 40, rightEdge: 300 },
    ])
  })

  it("renders annotation cards when highlights exist", () => {
    const props = createProps()
    const { container } = render(<AnnotationPanel {...props} />)

    expect(container.querySelector("svg")).toBeTruthy()
    expect(container.querySelector("[data-testid='annotation-panel']")).toBeTruthy()
  })

  it("renders empty panel wrapper when no positions exist", () => {
    vi.mocked(useAllHighlightPositions).mockReturnValue([])

    const props = createProps({
      layers: [createLayer({ highlights: [] })],
    })

    const { container } = render(<AnnotationPanel {...props} />)
    // Wrapper div always renders to reserve layout width
    expect(container.querySelector("[data-testid='annotation-panel']")).toBeTruthy()
    expect(container.querySelectorAll("line")).toHaveLength(0)
    expect(container.querySelector("svg")).toBeNull()
  })

  it("renders with fixed width of 224px", () => {
    const props = createProps()
    const { container } = render(<AnnotationPanel {...props} />)

    const panel = container.querySelector("[data-testid='annotation-panel']") as HTMLElement
    expect(panel.style.width).toBe("224px")
  })

  it("renders SVG connector lines", () => {
    const props = createProps()
    const { container } = render(<AnnotationPanel {...props} />)

    const lines = container.querySelectorAll("line")
    expect(lines).toHaveLength(1)
  })

  it("renders annotation card container", () => {
    const props = createProps()
    const { container } = render(<AnnotationPanel {...props} />)

    const cardContainer = container.querySelector(".z-10") as HTMLElement
    expect(cardContainer).toBeTruthy()
  })

  it("passes sectionVisibility to useAllHighlightPositions", () => {
    const props = createProps({ sectionVisibility: [true, false] })
    render(<AnnotationPanel {...props} />)

    expect(useAllHighlightPositions).toHaveBeenCalledWith(
      props.editorsRef,
      props.layers,
      props.containerRef,
      [true, false]
    )
  })

  it("handles multiple highlights across editors", () => {
    vi.mocked(useAllHighlightPositions).mockReturnValue([
      { highlightId: "h1", layerId: "layer-1", editorIndex: 0, top: 40, rightEdge: 300 },
      { highlightId: "h2", layerId: "layer-1", editorIndex: 1, top: 80, rightEdge: 250 },
    ])

    const layer = createLayer({
      highlights: [
        { id: "h1", editorIndex: 0, from: 0, to: 5, text: "hello", annotation: "Note 1" },
        { id: "h2", editorIndex: 1, from: 0, to: 3, text: "hey", annotation: "Note 2" },
      ],
    })

    const props = createProps({ layers: [layer] })
    const { container } = render(<AnnotationPanel {...props} />)

    const lines = container.querySelectorAll("line")
    expect(lines).toHaveLength(2)
  })
})
