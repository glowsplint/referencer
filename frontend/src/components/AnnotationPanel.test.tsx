import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnnotationPanel } from "./AnnotationPanel";
import type { Layer, EditingAnnotation } from "@/types/editor";
import type { Editor } from "@tiptap/react";
import { useAllHighlightPositions } from "@/hooks/annotations/use-all-highlight-positions";

// Mock hooks and libs
vi.mock("@/hooks/annotations/use-all-highlight-positions", () => ({
  useAllHighlightPositions: vi.fn(() => [
    { highlightId: "h1", layerId: "layer-1", editorIndex: 0, top: 40, rightEdge: 300 },
  ]),
}));

vi.mock("@/lib/resolve-annotation-overlaps", () => ({
  resolveAnnotationOverlaps: vi.fn((positions: { id: string; desiredTop: number }[]) =>
    positions.map((p) => ({ id: p.id, top: p.desiredTop })),
  ),
}));

vi.mock("@/lib/color", () => ({
  blendWithBackground: vi.fn((hex: string) => hex),
}));

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
        type: "comment",
        visible: true,
      },
    ],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

function createProps(overrides: Record<string, unknown> = {}) {
  const containerEl = document.createElement("div");
  Object.defineProperty(containerEl, "offsetWidth", { value: 800 });

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
  };
}

describe("AnnotationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAllHighlightPositions).mockReturnValue([
      { highlightId: "h1", layerId: "layer-1", editorIndex: 0, top: 40, rightEdge: 300 },
    ]);
  });

  describe("when annotations exist", () => {
    it("then shows the annotation panel", () => {
      const props = createProps();
      const { container } = render(<AnnotationPanel {...props} />);

      expect(container.querySelector("[data-testid='annotation-panel']")).toBeTruthy();
    });

    it("then draws connector lines to the editor", () => {
      const props = createProps();
      const { container } = render(<AnnotationPanel {...props} />);

      expect(container.querySelector("svg")).toBeTruthy();
      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(1);
    });
  });

  describe("when no annotations exist", () => {
    it("then shows the empty panel wrapper without connector lines", () => {
      vi.mocked(useAllHighlightPositions).mockReturnValue([]);

      const props = createProps({
        layers: [createLayer({ highlights: [] })],
      });

      const { container } = render(<AnnotationPanel {...props} />);
      expect(container.querySelector("[data-testid='annotation-panel']")).toBeTruthy();
      expect(container.querySelectorAll("line")).toHaveLength(0);
      expect(container.querySelector("svg")).toBeNull();
    });
  });

  describe("when sectionVisibility is provided", () => {
    it("then passes it to useAllHighlightPositions", () => {
      const props = createProps({ sectionVisibility: [true, false] });
      render(<AnnotationPanel {...props} />);

      expect(useAllHighlightPositions).toHaveBeenCalledWith(
        props.editorsRef,
        props.layers,
        props.containerRef,
        [true, false],
      );
    });
  });

  describe("when multiple highlights exist across editors", () => {
    it("then draws a connector line for each highlight", () => {
      vi.mocked(useAllHighlightPositions).mockReturnValue([
        { highlightId: "h1", layerId: "layer-1", editorIndex: 0, top: 40, rightEdge: 300 },
        { highlightId: "h2", layerId: "layer-1", editorIndex: 1, top: 80, rightEdge: 250 },
      ]);

      const layer = createLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "Note 1",
            type: "comment",
            visible: true,
          },
          {
            id: "h2",
            editorIndex: 1,
            from: 0,
            to: 3,
            text: "hey",
            annotation: "Note 2",
            type: "comment",
            visible: true,
          },
        ],
      });

      const props = createProps({ layers: [layer] });
      const { container } = render(<AnnotationPanel {...props} />);

      const lines = container.querySelectorAll("line");
      expect(lines).toHaveLength(2);
    });
  });

  describe("when collapse/expand callbacks are provided", () => {
    it("then shows the toggle collapse all button", () => {
      const props = createProps({
        onCollapseAll: vi.fn(),
        onExpandAll: vi.fn(),
        collapsedIds: new Set<string>(),
      });
      render(<AnnotationPanel {...props} />);
      expect(screen.getByTestId("toggleCollapseAll")).toBeInTheDocument();
    });

    describe("when some cards are expanded", () => {
      it("then shows 'Collapse all' title", () => {
        const props = createProps({
          onCollapseAll: vi.fn(),
          onExpandAll: vi.fn(),
          collapsedIds: new Set<string>(),
        });
        render(<AnnotationPanel {...props} />);
        expect(screen.getByTestId("toggleCollapseAll")).toHaveAttribute("title", "Collapse all");
      });

      it("then calls onCollapseAll when button is clicked", () => {
        const onCollapseAll = vi.fn();
        const onExpandAll = vi.fn();
        const props = createProps({
          onCollapseAll,
          onExpandAll,
          collapsedIds: new Set<string>(),
        });
        render(<AnnotationPanel {...props} />);
        fireEvent.click(screen.getByTestId("toggleCollapseAll"));
        expect(onCollapseAll).toHaveBeenCalled();
        expect(onExpandAll).not.toHaveBeenCalled();
      });
    });

    describe("when all cards are collapsed", () => {
      it("then shows 'Expand all' title", () => {
        const props = createProps({
          onCollapseAll: vi.fn(),
          onExpandAll: vi.fn(),
          collapsedIds: new Set(["h1"]),
        });
        render(<AnnotationPanel {...props} />);
        expect(screen.getByTestId("toggleCollapseAll")).toHaveAttribute("title", "Expand all");
      });

      it("then calls onExpandAll when button is clicked", () => {
        const onCollapseAll = vi.fn();
        const onExpandAll = vi.fn();
        const props = createProps({
          onCollapseAll,
          onExpandAll,
          collapsedIds: new Set(["h1"]),
        });
        render(<AnnotationPanel {...props} />);
        fireEvent.click(screen.getByTestId("toggleCollapseAll"));
        expect(onExpandAll).toHaveBeenCalled();
        expect(onCollapseAll).not.toHaveBeenCalled();
      });
    });
  });

  describe("when collapse/expand callbacks are not provided", () => {
    it("then hides the toggle collapse all button", () => {
      const props = createProps();
      render(<AnnotationPanel {...props} />);
      expect(screen.queryByTestId("toggleCollapseAll")).not.toBeInTheDocument();
    });
  });
});
