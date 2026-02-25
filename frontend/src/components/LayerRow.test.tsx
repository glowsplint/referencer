import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LayerRow } from "./LayerRow";
import { TAILWIND_300_COLORS } from "@/constants/colors";

import type { Layer, Highlight, Arrow } from "@/types/editor";

const defaultLayer: Layer = {
  id: "a",
  name: "Layer 1",
  color: "#fca5a5",
  visible: true,
  highlights: [],
  arrows: [],
  underlines: [],
};

import type { LayerUnderline } from "@/types/editor";

const makeHighlight = (id: string, text: string, annotation = "", editorIndex = 0): Highlight => ({
  id,
  editorIndex,
  from: 0,
  to: 5,
  text,
  annotation,
  type: "comment",
  visible: true,
});

const makeArrow = (
  id: string,
  fromText: string,
  toText: string,
  fromEditor = 0,
  toEditor = 1,
): Arrow => ({
  id,
  from: { editorIndex: fromEditor, from: 0, to: 5, text: fromText },
  to: { editorIndex: toEditor, from: 0, to: 5, text: toText },
  arrowStyle: "solid",
  visible: true,
});

const makeUnderline = (id: string, text: string, editorIndex = 0): LayerUnderline => ({
  id,
  editorIndex,
  from: 0,
  to: 5,
  text,
  visible: true,
});

function renderRow(overrides = {}) {
  const defaults = {
    layer: defaultLayer,
    index: 0,
    isActive: false,
    sectionNames: ["Passage 1", "Passage 2"],
    onSetActive: vi.fn(),
    onUpdateColor: vi.fn(),
    onUpdateName: vi.fn(),
    onToggleVisibility: vi.fn(),
    onRemoveHighlight: vi.fn(),
    onRemoveArrow: vi.fn(),
    onRemoveUnderline: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  return { ...render(<LayerRow {...props} />), props };
}

describe("LayerRow", () => {
  describe("when rendered", () => {
    it("then shows the layer name", () => {
      renderRow();
      expect(screen.getByText("Layer 1")).toBeInTheDocument();
    });

    it("then shows the colour swatch with the layer colour", () => {
      renderRow();
      const swatch = screen.getByTestId("layerSwatch-0");
      expect(swatch.style.backgroundColor).toBe("rgb(252, 165, 165)");
    });

    it("then makes the row draggable", () => {
      renderRow();
      expect(screen.getByTestId("layerRow")).toHaveAttribute("draggable", "true");
    });
  });

  describe("when drag starts", () => {
    it("then sets the layer id in dataTransfer", () => {
      renderRow();
      const row = screen.getByTestId("layerRow");
      const dataTransfer = { setData: vi.fn() };
      fireEvent.dragStart(row, { dataTransfer });
      expect(dataTransfer.setData).toHaveBeenCalledWith("application/x-layer-id", "a");
    });
  });

  describe("when swatch is clicked", () => {
    it("then opens the colour picker", () => {
      renderRow();
      expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId("layerSwatch-0"));
      expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument();
    });

    describe("when swatch is clicked again", () => {
      it("then closes the colour picker", () => {
        renderRow();
        fireEvent.click(screen.getByTestId("layerSwatch-0"));
        expect(screen.getByTestId("colorPicker-0")).toBeInTheDocument();
        fireEvent.click(screen.getByTestId("layerSwatch-0"));
        expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument();
      });
    });
  });

  describe("when a colour is selected from the picker", () => {
    it("then calls onUpdateColor with the selected colour", () => {
      const { props } = renderRow();
      fireEvent.click(screen.getByTestId("layerSwatch-0"));
      fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[5]}`));
      expect(props.onUpdateColor).toHaveBeenCalledWith(TAILWIND_300_COLORS[5]);
    });

    it("then closes the colour picker", () => {
      renderRow();
      fireEvent.click(screen.getByTestId("layerSwatch-0"));
      fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[5]}`));
      expect(screen.queryByTestId("colorPicker-0")).not.toBeInTheDocument();
    });
  });

  describe("when isActive is true", () => {
    it("then shows the Active tag", () => {
      renderRow({ isActive: true });
      expect(screen.getByTestId("layerActiveTag-0")).toHaveTextContent("Active");
    });
  });

  describe("when isActive is false", () => {
    it("then hides the Active tag", () => {
      renderRow({ isActive: false });
      expect(screen.queryByTestId("layerActiveTag-0")).not.toBeInTheDocument();
    });
  });

  describe("when the layer name is single-clicked", () => {
    it("then does not enter edit mode", () => {
      renderRow();
      fireEvent.click(screen.getByTestId("layerName-0"));
      expect(screen.queryByTestId("layerNameInput-0")).not.toBeInTheDocument();
    });
  });

  describe("when the layer name is double-clicked", () => {
    it("then enters edit mode with the current name", () => {
      renderRow();
      fireEvent.doubleClick(screen.getByTestId("layerName-0"));
      const input = screen.getByTestId("layerNameInput-0");
      expect(input).toBeInTheDocument();
      expect((input as HTMLInputElement).value).toBe("Layer 1");
    });

    it("then swaps the name from a div to an input", () => {
      renderRow();
      const label = screen.getByTestId("layerName-0");
      expect(label.tagName).toBe("DIV");
      fireEvent.doubleClick(label);
      expect(screen.queryByTestId("layerName-0")).not.toBeInTheDocument();
      const input = screen.getByTestId("layerNameInput-0");
      expect(input.tagName).toBe("INPUT");
    });
  });

  describe("when editing a layer name", () => {
    describe("when Enter is pressed", () => {
      it("then commits the new name", () => {
        const { props } = renderRow();
        fireEvent.doubleClick(screen.getByTestId("layerName-0"));
        const input = screen.getByTestId("layerNameInput-0");
        fireEvent.change(input, { target: { value: "My Layer" } });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(props.onUpdateName).toHaveBeenCalledWith("My Layer");
      });
    });

    describe("when Escape is pressed", () => {
      it("then cancels editing without committing", () => {
        const { props } = renderRow();
        fireEvent.doubleClick(screen.getByTestId("layerName-0"));
        const input = screen.getByTestId("layerNameInput-0");
        fireEvent.change(input, { target: { value: "My Layer" } });
        fireEvent.keyDown(input, { key: "Escape" });
        expect(props.onUpdateName).not.toHaveBeenCalled();
        expect(screen.getByTestId("layerName-0")).toBeInTheDocument();
      });
    });

    describe("when the input loses focus", () => {
      it("then commits the new name", () => {
        const { props } = renderRow();
        fireEvent.doubleClick(screen.getByTestId("layerName-0"));
        const input = screen.getByTestId("layerNameInput-0");
        fireEvent.change(input, { target: { value: "Blurred Name" } });
        fireEvent.blur(input);
        expect(props.onUpdateName).toHaveBeenCalledWith("Blurred Name");
      });
    });

    describe("when the input is empty", () => {
      it("then reverts to the previous name on commit", () => {
        const { props } = renderRow();
        fireEvent.doubleClick(screen.getByTestId("layerName-0"));
        const input = screen.getByTestId("layerNameInput-0");
        fireEvent.change(input, { target: { value: "   " } });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(props.onUpdateName).toHaveBeenCalledWith("Layer 1");
      });
    });
  });

  describe("when the row is clicked", () => {
    it("then calls onSetActive", () => {
      const { props } = renderRow();
      // Click on the layer name which is inside the row
      fireEvent.click(screen.getByText("Layer 1"));
      expect(props.onSetActive).toHaveBeenCalled();
    });
  });

  describe("when the layer is visible", () => {
    it("then shows the hide layer button", () => {
      renderRow();
      const btn = screen.getByTestId("layerVisibility-0");
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute("title", "Hide layer");
    });
  });

  describe("when the layer is hidden", () => {
    it("then shows the show layer button", () => {
      renderRow({ layer: { ...defaultLayer, visible: false } });
      const btn = screen.getByTestId("layerVisibility-0");
      expect(btn).toHaveAttribute("title", "Show layer");
    });
  });

  describe("when the visibility button is clicked", () => {
    it("then calls onToggleVisibility", () => {
      const { props } = renderRow();
      fireEvent.click(screen.getByTestId("layerVisibility-0"));
      expect(props.onToggleVisibility).toHaveBeenCalled();
    });

    it("then does not trigger onSetActive", () => {
      const { props } = renderRow();
      fireEvent.click(screen.getByTestId("layerVisibility-0"));
      expect(props.onSetActive).not.toHaveBeenCalled();
    });
  });

  describe("when the layer has no items", () => {
    it("then hides the chevron and count badge", () => {
      renderRow();
      expect(screen.queryByTestId("layerExpand-0")).not.toBeInTheDocument();
      expect(screen.queryByTestId("layerItemCount-0")).not.toBeInTheDocument();
    });
  });

  describe("when the layer has highlights", () => {
    it("then shows the chevron and count badge", () => {
      const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] };
      renderRow({ layer });
      expect(screen.getByTestId("layerExpand-0")).toBeInTheDocument();
      expect(screen.getByTestId("layerItemCount-0")).toHaveTextContent("1");
    });
  });

  describe("when the layer has arrows", () => {
    it("then shows the chevron and count badge", () => {
      const layer = { ...defaultLayer, arrows: [makeArrow("a1", "foo", "bar")] };
      renderRow({ layer });
      expect(screen.getByTestId("layerExpand-0")).toBeInTheDocument();
      expect(screen.getByTestId("layerItemCount-0")).toHaveTextContent("1");
    });
  });

  describe("when the layer has multiple item types", () => {
    it("then shows the combined count", () => {
      const layer = {
        ...defaultLayer,
        highlights: [makeHighlight("h1", "hello"), makeHighlight("h2", "world")],
        arrows: [makeArrow("a1", "foo", "bar")],
      };
      renderRow({ layer });
      expect(screen.getByTestId("layerItemCount-0")).toHaveTextContent("3");
    });
  });

  describe("when the chevron is clicked", () => {
    it("then expands the item list and hides the count badge", () => {
      const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] };
      renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      expect(screen.getByTestId("layerItems-0")).toBeInTheDocument();
      expect(screen.queryByTestId("layerItemCount-0")).not.toBeInTheDocument();
    });

    it("then does not trigger onSetActive", () => {
      const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] };
      const { props } = renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      expect(props.onSetActive).not.toHaveBeenCalled();
    });

    describe("when clicked again", () => {
      it("then collapses the item list", () => {
        const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] };
        renderRow({ layer });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.getByTestId("layerItems-0")).toBeInTheDocument();
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.queryByTestId("layerItems-0")).not.toBeInTheDocument();
      });
    });
  });

  describe("when expanded with highlights", () => {
    it("then shows annotation text for comment highlights", () => {
      const layer = {
        ...defaultLayer,
        highlights: [makeHighlight("h1", "selected text", "my note")],
      };
      renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      expect(screen.getByTestId("layerHighlight-h1")).toBeInTheDocument();
      expect(screen.getByText("my note")).toBeInTheDocument();
    });

    it("then shows selected text when annotation is empty", () => {
      const layer = {
        ...defaultLayer,
        highlights: [makeHighlight("h1", "selected text", "")],
      };
      renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      expect(screen.getByText("selected text")).toBeInTheDocument();
    });

    it("then includes the passage name in the title", () => {
      const layer = {
        ...defaultLayer,
        highlights: [makeHighlight("h1", "hello", "note", 1)],
      };
      renderRow({ layer, sectionNames: ["Intro", "Body"] });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      const span = screen.getByText("note");
      expect(span).toHaveAttribute("title", "note (Body)");
    });
  });

  describe("when expanded with arrows", () => {
    it("then shows arrow summary with word counts", () => {
      const layer = {
        ...defaultLayer,
        arrows: [makeArrow("a1", "hello beautiful world", "goodbye cruel world")],
      };
      renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      expect(screen.getByTestId("layerArrow-a1")).toBeInTheDocument();
      expect(screen.getByText("hello (3) \u2192 goodbye (3)")).toBeInTheDocument();
    });

    it("then includes passage names in the arrow title", () => {
      const layer = {
        ...defaultLayer,
        arrows: [makeArrow("a1", "foo", "bar", 0, 1)],
      };
      renderRow({ layer, sectionNames: ["Intro", "Body"] });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      const span = screen.getByText("foo (1) \u2192 bar (1)");
      expect(span).toHaveAttribute("title", "foo (Intro) \u2192 bar (Body)");
    });
  });

  describe("when expanded with underlines", () => {
    it("then shows underline items with text", () => {
      const layer = { ...defaultLayer, underlines: [makeUnderline("u1", "underlined text")] };
      renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      expect(screen.getByTestId("layerUnderline-u1")).toBeInTheDocument();
      expect(screen.getByText("underlined text")).toBeInTheDocument();
    });
  });

  describe("when highlight delete button is clicked", () => {
    it("then calls onRemoveHighlight with layer and highlight ids", () => {
      const layer = {
        ...defaultLayer,
        highlights: [makeHighlight("h1", "hello")],
      };
      const { props } = renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      fireEvent.click(screen.getByTestId("removeHighlight-h1"));
      expect(props.onRemoveHighlight).toHaveBeenCalledWith("a", "h1");
    });
  });

  describe("when arrow delete button is clicked", () => {
    it("then calls onRemoveArrow with layer and arrow ids", () => {
      const layer = {
        ...defaultLayer,
        arrows: [makeArrow("a1", "hello", "world")],
      };
      const { props } = renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      fireEvent.click(screen.getByTestId("removeArrow-a1"));
      expect(props.onRemoveArrow).toHaveBeenCalledWith("a", "a1");
    });
  });

  describe("when underline delete button is clicked", () => {
    it("then calls onRemoveUnderline with layer and underline ids", () => {
      const layer = { ...defaultLayer, underlines: [makeUnderline("u1", "text")] };
      const { props } = renderRow({ layer });
      fireEvent.click(screen.getByTestId("layerExpand-0"));
      fireEvent.click(screen.getByTestId("removeUnderline-u1"));
      expect(props.onRemoveUnderline).toHaveBeenCalledWith("a", "u1");
    });
  });

  describe("individual visibility toggles", () => {
    describe("when onToggleHighlightVisibility is provided", () => {
      it("then shows visibility toggle for highlights", () => {
        const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] };
        renderRow({ layer, onToggleHighlightVisibility: vi.fn() });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.getByTestId("toggleHighlightVisibility-h1")).toBeInTheDocument();
      });

      it("then calls the callback with correct args when clicked", () => {
        const onToggleHighlightVisibility = vi.fn();
        const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] };
        renderRow({ layer, onToggleHighlightVisibility });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        fireEvent.click(screen.getByTestId("toggleHighlightVisibility-h1"));
        expect(onToggleHighlightVisibility).toHaveBeenCalledWith("a", "h1");
      });

      it("then shows appropriate title based on visibility state", () => {
        const visibleHighlight = makeHighlight("h1", "hello");
        const hiddenHighlight = { ...makeHighlight("h2", "world"), visible: false };
        const layer = { ...defaultLayer, highlights: [visibleHighlight, hiddenHighlight] };
        renderRow({ layer, onToggleHighlightVisibility: vi.fn() });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.getByTestId("toggleHighlightVisibility-h1")).toHaveAttribute(
          "title",
          "Hide annotation",
        );
        expect(screen.getByTestId("toggleHighlightVisibility-h2")).toHaveAttribute(
          "title",
          "Show annotation",
        );
      });
    });

    describe("when onToggleHighlightVisibility is not provided", () => {
      it("then hides the highlight visibility toggle", () => {
        const layer = { ...defaultLayer, highlights: [makeHighlight("h1", "hello")] };
        renderRow({ layer });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.queryByTestId("toggleHighlightVisibility-h1")).not.toBeInTheDocument();
      });
    });

    describe("when onToggleArrowVisibility is provided", () => {
      it("then shows visibility toggle for arrows", () => {
        const layer = { ...defaultLayer, arrows: [makeArrow("a1", "foo", "bar")] };
        renderRow({ layer, onToggleArrowVisibility: vi.fn() });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.getByTestId("toggleArrowVisibility-a1")).toBeInTheDocument();
      });

      it("then calls the callback with correct args when clicked", () => {
        const onToggleArrowVisibility = vi.fn();
        const layer = { ...defaultLayer, arrows: [makeArrow("a1", "foo", "bar")] };
        renderRow({ layer, onToggleArrowVisibility });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        fireEvent.click(screen.getByTestId("toggleArrowVisibility-a1"));
        expect(onToggleArrowVisibility).toHaveBeenCalledWith("a", "a1");
      });

      it("then shows appropriate title for hidden arrows", () => {
        const hiddenArrow = { ...makeArrow("a1", "foo", "bar"), visible: false };
        const layer = { ...defaultLayer, arrows: [hiddenArrow] };
        renderRow({ layer, onToggleArrowVisibility: vi.fn() });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.getByTestId("toggleArrowVisibility-a1")).toHaveAttribute(
          "title",
          "Show arrow",
        );
      });
    });

    describe("when onToggleUnderlineVisibility is provided", () => {
      it("then shows visibility toggle for underlines", () => {
        const layer = { ...defaultLayer, underlines: [makeUnderline("u1", "text")] };
        renderRow({ layer, onToggleUnderlineVisibility: vi.fn() });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.getByTestId("toggleUnderlineVisibility-u1")).toBeInTheDocument();
      });

      it("then calls the callback with correct args when clicked", () => {
        const onToggleUnderlineVisibility = vi.fn();
        const layer = { ...defaultLayer, underlines: [makeUnderline("u1", "text")] };
        renderRow({ layer, onToggleUnderlineVisibility });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        fireEvent.click(screen.getByTestId("toggleUnderlineVisibility-u1"));
        expect(onToggleUnderlineVisibility).toHaveBeenCalledWith("a", "u1");
      });

      it("then shows appropriate title for hidden underlines", () => {
        const hiddenUnderline = { ...makeUnderline("u1", "text"), visible: false };
        const layer = { ...defaultLayer, underlines: [hiddenUnderline] };
        renderRow({ layer, onToggleUnderlineVisibility: vi.fn() });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        expect(screen.getByTestId("toggleUnderlineVisibility-u1")).toHaveAttribute(
          "title",
          "Show underline",
        );
      });
    });
  });
});
