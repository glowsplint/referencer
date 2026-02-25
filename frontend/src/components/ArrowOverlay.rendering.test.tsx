import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ArrowOverlay } from "./ArrowOverlay";
import type { Layer, DrawingState, ActiveTool } from "@/types/editor";
import type { Editor } from "@tiptap/react";

vi.mock("@/lib/tiptap/nearest-word", () => ({
  getWordCenter: vi.fn((word: { editorIndex: number; from: number }) => {
    return { cx: word.from * 10, cy: word.editorIndex * 50 + 25 };
  }),
  getWordRect: vi.fn((word: { editorIndex: number; from: number; to: number }) => {
    return {
      x: word.from * 10,
      y: word.editorIndex * 50 + 15,
      width: (word.to - word.from) * 10,
      height: 20,
    };
  }),
  getClampedWordCenter: vi.fn((word: { editorIndex: number; from: number }) => {
    return { cx: word.from * 10, cy: word.editorIndex * 50 + 25, clamped: false };
  }),
  getClampedWordCenterRelativeToWrapper: vi.fn((word: { editorIndex: number; from: number }) => {
    return { cx: word.from * 10, cy: word.editorIndex * 50 + 25, clamped: false };
  }),
  getWordCenterRelativeToWrapper: vi.fn((word: { editorIndex: number; from: number }) => {
    return { cx: word.from * 10, cy: word.editorIndex * 50 + 25 };
  }),
  getWordRectRelativeToWrapper: vi.fn((word: { editorIndex: number; from: number; to: number }) => {
    return {
      x: word.from * 10,
      y: word.editorIndex * 50 + 15,
      width: (word.to - word.from) * 10,
      height: 20,
    };
  }),
}));

function createLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "layer-1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

function createDefaultProps(overrides: Record<string, unknown> = {}) {
  const containerEl = document.createElement("div");
  containerEl.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    top: 0,
    right: 800,
    bottom: 600,
    left: 0,
    toJSON: () => {},
  });

  return {
    layers: [] as Layer[],
    drawingState: null as DrawingState | null,
    drawingColor: null as string | null,
    editorsRef: { current: new Map() } as React.RefObject<Map<number, Editor>>,
    containerRef: { current: containerEl } as React.RefObject<HTMLDivElement | null>,
    removeArrow: vi.fn(),
    selectedArrow: null as { layerId: string; arrowId: string } | null,
    setSelectedArrow: vi.fn(),
    activeTool: "selection" as ActiveTool,
    sectionVisibility: [true, true, true],
    isDarkMode: false,
    isLocked: true,
    hideOffscreenArrows: false,
    ...overrides,
  };
}

function createCrossEditorArrow(id = "a1") {
  return {
    id,
    from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    to: { editorIndex: 1, from: 10, to: 15, text: "world" },
  };
}

describe("ArrowOverlay rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when rendered", () => {
    it("then displays the arrow overlay SVG", () => {
      render(<ArrowOverlay {...createDefaultProps()} />);
      expect(screen.getByTestId("arrow-overlay")).toBeInTheDocument();
    });

    it("then displays the interaction layer SVG", () => {
      render(<ArrowOverlay {...createDefaultProps()} />);
      expect(screen.getByTestId("arrow-interaction-layer")).toBeInTheDocument();
    });
  });

  describe("when in light mode", () => {
    it("then applies multiply blend mode to the visual layer", () => {
      render(<ArrowOverlay {...createDefaultProps({ isDarkMode: false })} />);
      const svg = screen.getByTestId("arrow-overlay");
      expect(svg).toHaveStyle({ mixBlendMode: "multiply" });
    });

    it("then does not apply blend mode to the interaction layer", () => {
      render(<ArrowOverlay {...createDefaultProps({ isDarkMode: false })} />);
      const interactionLayer = screen.getByTestId("arrow-interaction-layer");
      expect(interactionLayer).not.toHaveStyle({ mixBlendMode: "multiply" });
      expect(interactionLayer).not.toHaveStyle({ mixBlendMode: "screen" });
    });
  });

  describe("when in dark mode", () => {
    it("then applies screen blend mode to the visual layer", () => {
      render(<ArrowOverlay {...createDefaultProps({ isDarkMode: true })} />);
      const svg = screen.getByTestId("arrow-overlay");
      expect(svg).toHaveStyle({ mixBlendMode: "screen" });
    });
  });

  describe("when layers have cross-editor arrows", () => {
    it("then draws arrow lines for visible layers", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);
      expect(screen.getAllByTestId("arrow-line")).toHaveLength(1);
    });

    it("then draws arrows from multiple layers", () => {
      const layer1 = createLayer({ id: "l1", arrows: [createCrossEditorArrow("a1")] });
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
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer1, layer2] })} />);
      expect(screen.getAllByTestId("arrow-line")).toHaveLength(2);
    });

    it("then places arrow lines in the visual layer", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const arrowLine = screen.getByTestId("arrow-line");
      const visualLayer = screen.getByTestId("arrow-overlay");
      const interactionLayer = screen.getByTestId("arrow-interaction-layer");
      expect(visualLayer.contains(arrowLine)).toBe(true);
      expect(interactionLayer.contains(arrowLine)).toBe(false);
    });

    it("then uses the layer color for both the arrow line and arrowhead", () => {
      const layerColor = "#fca5a5";
      const layer = createLayer({ color: layerColor, arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const line = screen.getByTestId("arrow-line");
      expect(line.getAttribute("stroke")).toBe(layerColor);

      const marker = document.getElementById("arrowhead-a1");
      const polygon = marker?.querySelector("polygon");
      expect(polygon?.getAttribute("fill")).toBe(layerColor);
    });

    it("then renders an arrowhead marker on the line", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const arrowLine = screen.getByTestId("arrow-line");
      expect(arrowLine.getAttribute("marker-mid")).toBe("url(#arrowhead-a1)");
    });

    it("then renders one hit area per visible arrow in the interaction layer", () => {
      const layer = createLayer({
        arrows: [
          createCrossEditorArrow("a1"),
          {
            id: "a2",
            from: { editorIndex: 0, from: 20, to: 25, text: "foo" },
            to: { editorIndex: 1, from: 30, to: 35, text: "bar" },
          },
        ],
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      expect(screen.getAllByTestId("arrow-hit-area")).toHaveLength(2);
    });

    it("then places hit areas in the interaction layer", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const hitArea = screen.getByTestId("arrow-hit-area");
      const interactionLayer = screen.getByTestId("arrow-interaction-layer");
      const visualLayer = screen.getByTestId("arrow-overlay");
      expect(interactionLayer.contains(hitArea)).toBe(true);
      expect(visualLayer.contains(hitArea)).toBe(false);
    });

    it("then uses the same path geometry for visual and hit area", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const arrowLine = screen.getByTestId("arrow-line");
      const hitArea = screen.getByTestId("arrow-hit-area");
      expect(arrowLine.getAttribute("d")).toBe(hitArea.getAttribute("d"));
    });
  });

  describe("when a layer is invisible", () => {
    it("then does not render arrow lines", () => {
      const layer = createLayer({ visible: false, arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);
      expect(screen.queryByTestId("arrow-line")).not.toBeInTheDocument();
    });

    it("then does not render hit areas or delete icons", () => {
      const layer = createLayer({ visible: false, arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);
      expect(screen.queryByTestId("arrow-hit-area")).not.toBeInTheDocument();
    });
  });

  describe("when a section is hidden", () => {
    it("then hides arrows with an endpoint in that section", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            sectionVisibility: [true, false, true],
          })}
        />,
      );
      expect(screen.queryByTestId("arrow-line")).not.toBeInTheDocument();
    });

    it("then hides hit areas for those arrows", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            sectionVisibility: [true, false, true],
          })}
        />,
      );
      expect(screen.queryByTestId("arrow-hit-area")).not.toBeInTheDocument();
    });
  });

  describe("when an arrow is within the same editor", () => {
    it("then does not render a visual arrow line (handled by the editor plugin)", () => {
      const layer = createLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
            to: { editorIndex: 0, from: 10, to: 15, text: "world" },
          },
        ],
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);
      expect(screen.queryByTestId("arrow-line")).not.toBeInTheDocument();
    });

    it("then still renders a hit area for interaction", () => {
      const layer = createLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 1, to: 5, text: "hello" },
            to: { editorIndex: 0, from: 10, to: 15, text: "world" },
          },
        ],
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);
      expect(screen.getByTestId("arrow-hit-area")).toBeInTheDocument();
    });
  });

  describe("when an arrow has a dashed style", () => {
    it("then renders with a dash pattern different from solid", () => {
      const layer = createLayer({
        arrows: [{ ...createCrossEditorArrow(), arrowStyle: "dashed" as const }],
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const line = screen.getByTestId("arrow-line");
      expect(line.getAttribute("stroke-dasharray")).toBeTruthy();
    });
  });

  describe("when an arrow has a dotted style", () => {
    it("then renders with a dash pattern different from dashed", () => {
      const dashedLayer = createLayer({
        id: "l-dashed",
        arrows: [{ ...createCrossEditorArrow("a-dashed"), arrowStyle: "dashed" as const }],
      });
      const dottedLayer = createLayer({
        id: "l-dotted",
        arrows: [
          {
            id: "a-dotted",
            from: { editorIndex: 0, from: 20, to: 25, text: "foo" },
            to: { editorIndex: 1, from: 30, to: 35, text: "bar" },
            arrowStyle: "dotted" as const,
          },
        ],
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [dashedLayer, dottedLayer] })} />);

      const lines = screen.getAllByTestId("arrow-line");
      const dashedDash = lines[0].getAttribute("stroke-dasharray");
      const dottedDash = lines[1].getAttribute("stroke-dasharray");
      expect(dashedDash).toBeTruthy();
      expect(dottedDash).toBeTruthy();
      expect(dashedDash).not.toBe(dottedDash);
    });
  });

  describe("when an arrow has a solid style", () => {
    it("then renders without a dash pattern", () => {
      const layer = createLayer({
        arrows: [{ ...createCrossEditorArrow(), arrowStyle: "solid" as const }],
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const line = screen.getByTestId("arrow-line");
      expect(line.getAttribute("stroke-dasharray")).toBeNull();
    });
  });

  describe("when an arrow has a double style", () => {
    it("then renders two parallel path elements", () => {
      const layer = createLayer({
        arrows: [{ ...createCrossEditorArrow(), arrowStyle: "double" as const }],
      });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const lines = screen.getAllByTestId("arrow-line");
      expect(lines).toHaveLength(2);
    });
  });

  describe("when drawing a new arrow", () => {
    const drawingState: DrawingState = {
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 10, to: 15, text: "world" },
    };

    it("then shows a dashed preview line", () => {
      render(<ArrowOverlay {...createDefaultProps({ drawingState, drawingColor: "#fca5a5" })} />);

      const preview = screen.getByTestId("preview-arrow");
      expect(preview).toBeInTheDocument();
      expect(preview.getAttribute("stroke-dasharray")).toBeTruthy();
    });

    it("then places the preview in the visual layer", () => {
      render(<ArrowOverlay {...createDefaultProps({ drawingState, drawingColor: "#fca5a5" })} />);

      const preview = screen.getByTestId("preview-arrow");
      const visualLayer = screen.getByTestId("arrow-overlay");
      const interactionLayer = screen.getByTestId("arrow-interaction-layer");
      expect(visualLayer.contains(preview)).toBe(true);
      expect(interactionLayer.contains(preview)).toBe(false);
    });

    it("then highlights the anchor word with a colored rect", () => {
      render(<ArrowOverlay {...createDefaultProps({ drawingState, drawingColor: "#fca5a5" })} />);

      const anchorRect = screen.getByTestId("preview-anchor-rect");
      expect(anchorRect).toBeInTheDocument();
      expect(anchorRect.getAttribute("fill")).toBe("#fca5a5");
    });
  });

  describe("when the anchor and cursor are the same word", () => {
    const sameWordDrawing: DrawingState = {
      anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
      cursor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
    };

    it("then shows the anchor highlight but not the preview line", () => {
      render(
        <ArrowOverlay
          {...createDefaultProps({ drawingState: sameWordDrawing, drawingColor: "#fca5a5" })}
        />,
      );

      expect(screen.getByTestId("preview-anchor-rect")).toBeInTheDocument();
      expect(screen.queryByTestId("preview-arrow")).not.toBeInTheDocument();
    });
  });

  describe("when the drawing color is null", () => {
    it("then does not render a preview", () => {
      const drawingState: DrawingState = {
        anchor: { editorIndex: 0, from: 1, to: 5, text: "hello" },
        cursor: { editorIndex: 0, from: 10, to: 15, text: "world" },
      };
      render(<ArrowOverlay {...createDefaultProps({ drawingState, drawingColor: null })} />);

      expect(screen.queryByTestId("preview-arrow")).not.toBeInTheDocument();
    });
  });

  describe("when an arrow is selected", () => {
    it("then hides the arrowhead marker on the selected arrow", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      const { rerender } = render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const arrowLine = screen.getByTestId("arrow-line");
      expect(arrowLine.getAttribute("marker-mid")).toBe("url(#arrowhead-a1)");

      rerender(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );
      expect(arrowLine.getAttribute("marker-mid")).toBeNull();
    });

    it("then shows a selection ring around the arrow", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      expect(screen.getByTestId("arrow-selection-ring")).toBeInTheDocument();
    });

    it("then shows the selection ring with the layer color", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      const ring = screen.getByTestId("arrow-selection-ring");
      expect(ring.getAttribute("stroke")).toBe("#fca5a5");
    });
  });

  describe("when an arrow is deselected", () => {
    it("then restores the arrowhead marker", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      const { rerender } = render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      rerender(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const arrowLine = screen.getByTestId("arrow-line");
      expect(arrowLine.getAttribute("marker-mid")).toBe("url(#arrowhead-a1)");
    });

    it("then removes the selection ring", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], selectedArrow: null })} />);

      expect(screen.queryByTestId("arrow-selection-ring")).not.toBeInTheDocument();
    });
  });

  describe("when scrolling within the container", () => {
    it("then recalculates arrow positions", async () => {
      const { getClampedWordCenter } = vi.mocked(await import("@/lib/tiptap/nearest-word"));
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      const props = createDefaultProps({ layers: [layer] });
      render(<ArrowOverlay {...props} />);

      const callsBefore = getClampedWordCenter.mock.calls.length;

      const { act } = await import("@testing-library/react");
      act(() => {
        props.containerRef.current!.dispatchEvent(new Event("scroll", { bubbles: false }));
      });

      expect(getClampedWordCenter.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
