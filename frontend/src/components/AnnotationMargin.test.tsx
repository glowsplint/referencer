import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AnnotationMargin } from "./AnnotationMargin"
import type { Layer, EditingAnnotation } from "@/types/editor"
import type { Editor } from "@tiptap/react"
import { useHighlightPositions } from "@/hooks/use-highlight-positions"

// Mock hooks and libs
vi.mock("@/hooks/use-highlight-positions", () => ({
  useHighlightPositions: vi.fn(() => [
    { highlightId: "h1", layerId: "layer-1", top: 40, rightEdge: 300 },
  ]),
}))

vi.mock("@/lib/resolve-annotation-overlaps", () => ({
  resolveAnnotationOverlaps: vi.fn((positions: { id: string; desiredTop: number }[]) =>
    positions.map((p) => ({ id: p.id, top: p.desiredTop }))
  ),
}))

vi.mock("@/lib/color", () => ({
  parseHexToRgba: vi.fn((hex: string, _alpha: number) => hex),
}))

// Polyfill ResizeObserver for jsdom
let resizeCallback: ResizeObserverCallback
class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    resizeCallback = cb
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
vi.stubGlobal("ResizeObserver", MockResizeObserver)

function triggerResize(width: number) {
  resizeCallback(
    [{ contentRect: { width } } as ResizeObserverEntry],
    {} as ResizeObserver
  )
}

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
  const wrapperEl = document.createElement("div")

  return {
    editor: {} as Editor,
    editorIndex: 0,
    layers: [createLayer()],
    wrapperRef: { current: wrapperEl } as React.RefObject<HTMLDivElement | null>,
    editingAnnotation: null as EditingAnnotation | null,
    onAnnotationChange: vi.fn(),
    onAnnotationBlur: vi.fn(),
    onAnnotationClick: vi.fn(),
    ...overrides,
  }
}

describe("AnnotationMargin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders annotation cards when highlights exist", () => {
    const props = createProps()
    const { container } = render(<AnnotationMargin {...props} />)

    // Should render SVG and annotation card container
    expect(container.querySelector("svg")).toBeTruthy()
    expect(container.querySelector(".z-10")).toBeTruthy()
  })

  it("returns null when no highlights match", () => {
    vi.mocked(useHighlightPositions).mockReturnValue([])

    const props = createProps({
      layers: [createLayer({ highlights: [] })],
    })

    const { container } = render(<AnnotationMargin {...props} />)
    expect(container.innerHTML).toBe("")
  })

  it("uses 0px left position before resize fires", () => {
    const props = createProps()
    const { container } = render(<AnnotationMargin {...props} />)

    const cardContainer = container.querySelector(".z-10") as HTMLElement
    expect(cardContainer.style.left).toBe("0px")
  })

  it("pins annotations to right edge (550px wrapper)", () => {
    const props = createProps()
    const { container } = render(<AnnotationMargin {...props} />)

    act(() => triggerResize(550))

    const cardContainer = container.querySelector(".z-10") as HTMLElement
    // 550 - 192 - 16 = 342
    expect(cardContainer.style.left).toBe("342px")
  })

  it("pins annotations to right edge (1200px wrapper)", () => {
    const props = createProps()
    const { container } = render(<AnnotationMargin {...props} />)

    act(() => triggerResize(1200))

    const cardContainer = container.querySelector(".z-10") as HTMLElement
    // 1200 - 192 - 16 = 992
    expect(cardContainer.style.left).toBe("992px")
  })

  it("pins annotations to right edge (367px wrapper)", () => {
    const props = createProps()
    const { container } = render(<AnnotationMargin {...props} />)

    act(() => triggerResize(367))

    const cardContainer = container.querySelector(".z-10") as HTMLElement
    // 367 - 192 - 16 = 159
    expect(cardContainer.style.left).toBe("159px")
  })

  it("SVG width matches wrapper right edge", () => {
    const props = createProps()
    const { container } = render(<AnnotationMargin {...props} />)

    act(() => triggerResize(550))

    const svg = container.querySelector("svg") as SVGElement
    // annotationLeft (342) + CARD_WIDTH (192) + 16 = 550
    expect(svg.style.width).toBe("550px")
  })

})
