import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ArrowOverlay } from "./ArrowOverlay";
import type { Layer, ActiveTool } from "@/types/editor";
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
    drawingState: null,
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

describe("ArrowOverlay interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when an arrow is clicked", () => {
    it("then selects that arrow", () => {
      const setSelectedArrow = vi.fn();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], setSelectedArrow })} />);

      fireEvent.click(screen.getByTestId("arrow-hit-area"));
      expect(setSelectedArrow).toHaveBeenCalledWith({ layerId: "layer-1", arrowId: "a1" });
    });

    it("then selects only the clicked arrow among multiple", () => {
      const setSelectedArrow = vi.fn();
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
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], setSelectedArrow })} />);

      const hitAreas = screen.getAllByTestId("arrow-hit-area");
      fireEvent.click(hitAreas[0]);

      expect(setSelectedArrow).toHaveBeenCalledTimes(1);
      expect(setSelectedArrow).toHaveBeenCalledWith({ layerId: "layer-1", arrowId: "a1" });
    });
  });

  describe("when the arrow tool is active", () => {
    it("then hit areas do not respond to clicks", () => {
      const setSelectedArrow = vi.fn();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({ layers: [layer], setSelectedArrow, activeTool: "arrow" })}
        />,
      );

      const hitArea = screen.getByTestId("arrow-hit-area");
      // When arrow tool is active, pointer-events are set to "none" on the hit area,
      // so in a real browser clicks wouldn't reach it. We verify the behavior by
      // checking that the element is styled to be non-interactive.
      expect(hitArea).toHaveStyle({ pointerEvents: "none" });
    });
  });

  describe("when the selection tool is active", () => {
    it("then hit areas respond to clicks", () => {
      const setSelectedArrow = vi.fn();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({ layers: [layer], setSelectedArrow, activeTool: "selection" })}
        />,
      );

      fireEvent.click(screen.getByTestId("arrow-hit-area"));
      expect(setSelectedArrow).toHaveBeenCalledWith({ layerId: "layer-1", arrowId: "a1" });
    });
  });

  describe("when hovering over an arrow", () => {
    it("then highlights the arrow with a hover ring", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      expect(screen.queryByTestId("arrow-hover-ring")).not.toBeInTheDocument();

      fireEvent.mouseEnter(screen.getByTestId("arrow-hit-area"));
      expect(screen.getByTestId("arrow-hover-ring")).toBeInTheDocument();
    });

    it("then removes the hover ring on mouse leave", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      fireEvent.mouseEnter(screen.getByTestId("arrow-hit-area"));
      expect(screen.getByTestId("arrow-hover-ring")).toBeInTheDocument();

      fireEvent.mouseLeave(screen.getByTestId("arrow-hit-area"));
      expect(screen.queryByTestId("arrow-hover-ring")).not.toBeInTheDocument();
    });

    it("then preserves the arrowhead marker", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      const arrowLine = screen.getByTestId("arrow-line");
      expect(arrowLine.getAttribute("marker-mid")).toBe("url(#arrowhead-a1)");

      fireEvent.mouseEnter(screen.getByTestId("arrow-hit-area"));
      expect(arrowLine.getAttribute("marker-mid")).toBe("url(#arrowhead-a1)");
    });

    it("then does not show the hover ring if the arrow is already selected", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      fireEvent.mouseEnter(screen.getByTestId("arrow-hit-area"));
      expect(screen.queryByTestId("arrow-hover-ring")).not.toBeInTheDocument();
      expect(screen.getByTestId("arrow-selection-ring")).toBeInTheDocument();
    });

    it("then does not show the delete button on hover alone", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(<ArrowOverlay {...createDefaultProps({ layers: [layer] })} />);

      expect(screen.queryByTestId("arrow-delete-icon")).not.toBeInTheDocument();

      fireEvent.mouseEnter(screen.getByTestId("arrow-hit-area"));
      expect(screen.queryByTestId("arrow-delete-icon")).not.toBeInTheDocument();
    });
  });

  describe("when an arrow is selected", () => {
    it("then shows a delete button", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      expect(screen.getByTestId("arrow-delete-icon")).toBeInTheDocument();
    });

    it("then hides the delete button when deselected", () => {
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      const { rerender } = render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      expect(screen.getByTestId("arrow-delete-icon")).toBeInTheDocument();

      rerender(<ArrowOverlay {...createDefaultProps({ layers: [layer], selectedArrow: null })} />);
      expect(screen.queryByTestId("arrow-delete-icon")).not.toBeInTheDocument();
    });

    it("then only shows the delete button on the selected arrow", () => {
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
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      expect(screen.getAllByTestId("arrow-delete-icon")).toHaveLength(1);
    });
  });

  describe("when the delete button is clicked", () => {
    it("then removes the arrow", () => {
      const removeArrow = vi.fn();
      const setSelectedArrow = vi.fn();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            removeArrow,
            setSelectedArrow,
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      fireEvent.click(screen.getByTestId("arrow-delete-icon"));
      expect(removeArrow).toHaveBeenCalledWith("layer-1", "a1");
    });

    it("then clears the selection", () => {
      const removeArrow = vi.fn();
      const setSelectedArrow = vi.fn();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });
      render(
        <ArrowOverlay
          {...createDefaultProps({
            layers: [layer],
            removeArrow,
            setSelectedArrow,
            selectedArrow: { layerId: "layer-1", arrowId: "a1" },
          })}
        />,
      );

      fireEvent.click(screen.getByTestId("arrow-delete-icon"));
      expect(setSelectedArrow).toHaveBeenCalledWith(null);
    });
  });
});

// ── Editor hover tracking and wrapper SVG tests ──

function createMockEditorWithWrapper(wrapper: HTMLElement) {
  return {
    view: {
      dom: {
        closest: vi.fn((selector: string) => {
          if (selector === ".simple-editor-wrapper") return wrapper;
          return null;
        }),
      },
    },
  } as unknown as Editor;
}

function createMockWrapper() {
  const wrapper = document.createElement("div");
  wrapper.className = "simple-editor-wrapper";
  Object.defineProperty(wrapper, "scrollWidth", { value: 400, configurable: true });
  Object.defineProperty(wrapper, "scrollHeight", { value: 300, configurable: true });
  document.body.appendChild(wrapper);
  return wrapper;
}

describe("ArrowOverlay editor hover tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.querySelectorAll(".simple-editor-wrapper").forEach((el) => el.remove());
  });

  function createEditorsWithWrappers() {
    const wrapper0 = createMockWrapper();
    const wrapper1 = createMockWrapper();
    const editor0 = createMockEditorWithWrapper(wrapper0);
    const editor1 = createMockEditorWithWrapper(wrapper1);
    const editorsRef = {
      current: new Map([
        [0, editor0],
        [1, editor1],
      ]),
    } as React.RefObject<Map<number, Editor>>;
    return { wrapper0, wrapper1, editorsRef };
  }

  describe("when hovering over an editor that has cross-editor arrows", () => {
    it("then clips the container SVG to the gap between editors", () => {
      const { wrapper0, editorsRef } = createEditorsWithWrappers();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });

      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], editorsRef })} />);

      const containerSvg = screen.getByTestId("arrow-overlay");
      expect(containerSvg.getAttribute("clip-path")).toBeNull();

      act(() => {
        fireEvent.mouseEnter(wrapper0);
      });

      expect(containerSvg.getAttribute("clip-path")).toBe("url(#container-gap-clip)");
    });

    it("then shows wrapper SVGs for scrolling synchronization", () => {
      const { wrapper0, editorsRef } = createEditorsWithWrappers();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });

      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], editorsRef })} />);

      const wrapperSvg0 = wrapper0.querySelector(
        "[data-testid='wrapper-arrow-svg-0']",
      ) as SVGSVGElement;
      expect(wrapperSvg0).toBeTruthy();
      expect(wrapperSvg0.style.display).toBe("none");

      act(() => {
        fireEvent.mouseEnter(wrapper0);
      });

      expect(wrapperSvg0.style.display).toBe("");
    });

    it("then shows all wrapper SVGs so each clips its own portion", () => {
      const { wrapper0, wrapper1, editorsRef } = createEditorsWithWrappers();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });

      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], editorsRef })} />);

      const wrapperSvg0 = wrapper0.querySelector(
        "[data-testid='wrapper-arrow-svg-0']",
      ) as SVGSVGElement;
      const wrapperSvg1 = wrapper1.querySelector(
        "[data-testid='wrapper-arrow-svg-1']",
      ) as SVGSVGElement;

      act(() => {
        fireEvent.mouseEnter(wrapper0);
      });

      expect(wrapperSvg0.style.display).toBe("");
      expect(wrapperSvg1.style.display).toBe("");
    });

    it("then keeps hit areas in the container-level interaction layer", () => {
      const { wrapper0, editorsRef } = createEditorsWithWrappers();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });

      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], editorsRef })} />);

      act(() => {
        fireEvent.mouseEnter(wrapper0);
      });

      const hitArea = screen.getByTestId("arrow-hit-area");
      const interactionLayer = screen.getByTestId("arrow-interaction-layer");
      expect(interactionLayer.contains(hitArea)).toBe(true);
    });
  });

  describe("when leaving an editor", () => {
    it("then removes the container clip-path", () => {
      const { wrapper0, editorsRef } = createEditorsWithWrappers();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });

      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], editorsRef })} />);

      const containerSvg = screen.getByTestId("arrow-overlay");

      act(() => {
        fireEvent.mouseEnter(wrapper0);
      });
      expect(containerSvg.getAttribute("clip-path")).toBe("url(#container-gap-clip)");

      act(() => {
        fireEvent.mouseLeave(wrapper0);
      });
      expect(containerSvg.getAttribute("clip-path")).toBeNull();
    });

    it("then hides wrapper SVGs", () => {
      const { wrapper0, editorsRef } = createEditorsWithWrappers();
      const layer = createLayer({ arrows: [createCrossEditorArrow()] });

      render(<ArrowOverlay {...createDefaultProps({ layers: [layer], editorsRef })} />);

      const wrapperSvg0 = wrapper0.querySelector(
        "[data-testid='wrapper-arrow-svg-0']",
      ) as SVGSVGElement;

      act(() => {
        fireEvent.mouseEnter(wrapper0);
      });
      expect(wrapperSvg0.style.display).toBe("");

      act(() => {
        fireEvent.mouseLeave(wrapper0);
      });
      expect(wrapperSvg0.style.display).toBe("none");
    });
  });
});
