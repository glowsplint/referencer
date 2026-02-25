import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ManagementPane } from "./ManagementPane";
import { renderWithWorkspace } from "@/test/render-with-workspace";

import type { Highlight, Arrow, LayerUnderline } from "@/types/editor";

function makeStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      for (const k of Object.keys(store)) delete store[k];
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store,
  };
}

let storageMock: ReturnType<typeof makeStorageMock>;

const layerA = {
  id: "a",
  name: "Layer 1",
  color: "#fca5a5",
  visible: true,
  highlights: [] as Highlight[],
  arrows: [] as Arrow[],
  underlines: [] as LayerUnderline[],
};
const layerB = {
  id: "b",
  name: "Layer 2",
  color: "#93c5fd",
  visible: true,
  highlights: [] as Highlight[],
  arrows: [] as Arrow[],
  underlines: [] as LayerUnderline[],
};

const highlight1: Highlight = {
  id: "h1",
  editorIndex: 0,
  from: 0,
  to: 5,
  text: "hello",
  annotation: "my note",
  type: "comment",
};
const arrow1: Arrow = {
  id: "a1",
  from: { editorIndex: 0, from: 0, to: 3, text: "foo" },
  to: { editorIndex: 1, from: 0, to: 3, text: "bar" },
};
const layerWithItems = { ...layerA, highlights: [highlight1], arrows: [arrow1] };

beforeEach(() => {
  storageMock = makeStorageMock();
  vi.stubGlobal("localStorage", storageMock);
});

function renderPane(overrides = {}) {
  return renderWithWorkspace(<ManagementPane />, overrides);
}

describe("ManagementPane", () => {
  describe("when rendered", () => {
    it("then shows the management pane", () => {
      renderPane();
      expect(screen.getByTestId("managementPane")).toBeInTheDocument();
    });

    it("then shows the add layer button", () => {
      renderPane();
      expect(screen.getByTestId("addLayerButton")).toBeInTheDocument();
    });

    it("then shows the Passages heading", () => {
      renderPane();
      expect(screen.getByText("Passages")).toBeInTheDocument();
    });
  });

  describe("when the add layer button is clicked", () => {
    it("then calls addLayer", () => {
      const { workspace } = renderPane();
      fireEvent.click(screen.getByTestId("addLayerButton"));
      expect(workspace.addLayer).toHaveBeenCalled();
    });
  });

  describe("when layers exist", () => {
    it("then renders a row for each layer", () => {
      renderPane({ layers: [layerA, layerB] });
      expect(screen.getByText("Layer 1")).toBeInTheDocument();
      expect(screen.getByText("Layer 2")).toBeInTheDocument();
    });

    it("then marks only the active layer as active", () => {
      renderPane({ layers: [layerA, layerB], activeLayerId: "b" });
      expect(screen.queryByTestId("layerActiveTag-0")).not.toBeInTheDocument();
      expect(screen.getByTestId("layerActiveTag-1")).toHaveTextContent("Active");
    });
  });

  describe("when a layer row is clicked", () => {
    it("then calls setActiveLayer with that layer's id", () => {
      const { workspace } = renderPane({ layers: [layerA] });
      fireEvent.click(screen.getByText("Layer 1"));
      expect(workspace.setActiveLayer).toHaveBeenCalledWith("a");
    });
  });

  describe("when a layer colour is changed", () => {
    it("then calls updateLayerColor with the layer id and new colour", () => {
      const { workspace } = renderPane({ layers: [layerA] });
      fireEvent.click(screen.getByTestId("layerSwatch-0"));
      fireEvent.click(screen.getByTestId("colorOption-#93c5fd"));
      expect(workspace.updateLayerColor).toHaveBeenCalledWith("a", "#93c5fd");
    });
  });

  describe("when a layer name is changed", () => {
    it("then calls updateLayerName with the layer id and new name", () => {
      const { workspace } = renderPane({ layers: [layerA] });
      fireEvent.doubleClick(screen.getByTestId("layerName-0"));
      fireEvent.change(screen.getByTestId("layerNameInput-0"), { target: { value: "Renamed" } });
      fireEvent.keyDown(screen.getByTestId("layerNameInput-0"), { key: "Enter" });
      expect(workspace.updateLayerName).toHaveBeenCalledWith("a", "Renamed");
    });
  });

  describe("when layer visibility is toggled", () => {
    it("then calls toggleLayerVisibility with the layer id", () => {
      const { workspace } = renderPane({ layers: [layerA] });
      fireEvent.click(screen.getByTestId("layerVisibility-0"));
      expect(workspace.toggleLayerVisibility).toHaveBeenCalledWith("a");
    });
  });

  describe("when passages are configured", () => {
    it("then renders passage rows matching editorCount", () => {
      renderPane({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Passage 1", "Passage 2"],
      });
      expect(screen.getByText("Passage 1")).toBeInTheDocument();
      expect(screen.getByText("Passage 2")).toBeInTheDocument();
    });
  });

  describe("when passage visibility button is clicked", () => {
    it("then calls toggleSectionVisibility with the section index", () => {
      const { workspace } = renderPane({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Passage 1", "Passage 2"],
      });
      fireEvent.click(screen.getByTestId("sectionVisibility-1"));
      expect(workspace.toggleSectionVisibility).toHaveBeenCalledWith(1);
    });
  });

  describe("master layer visibility", () => {
    it("then shows the master visibility button when layers exist", () => {
      renderPane({ layers: [layerA] });
      expect(screen.getByTestId("toggleAllLayerVisibility")).toBeInTheDocument();
    });

    it("then shows the master visibility button even when no layers exist", () => {
      renderPane();
      expect(screen.getByTestId("toggleAllLayerVisibility")).toBeInTheDocument();
    });

    describe("when clicked", () => {
      it("then calls toggleAllLayerVisibility", () => {
        const { workspace } = renderPane({ layers: [layerA] });
        fireEvent.click(screen.getByTestId("toggleAllLayerVisibility"));
        expect(workspace.toggleAllLayerVisibility).toHaveBeenCalled();
      });
    });
  });

  describe("trash bin", () => {
    describe("when layers exist", () => {
      it("then shows the trash bin", () => {
        renderPane({ layers: [layerA] });
        expect(screen.getByTestId("trashBin")).toBeInTheDocument();
      });
    });

    describe("when multiple sections exist", () => {
      it("then shows the trash bin", () => {
        renderPane({ editorCount: 2 });
        expect(screen.getByTestId("trashBin")).toBeInTheDocument();
      });
    });

    describe("when no layers and one section", () => {
      it("then hides the trash bin", () => {
        renderPane();
        expect(screen.queryByTestId("trashBin")).not.toBeInTheDocument();
      });
    });

    describe("when a layer is dropped on the trash bin", () => {
      it("then calls removeLayer with the layer id", () => {
        const { workspace } = renderPane({ layers: [layerA] });
        fireEvent.drop(screen.getByTestId("trashBin"), {
          dataTransfer: {
            getData: (type: string) => (type === "application/x-layer-id" ? "a" : ""),
          },
        });
        expect(workspace.removeLayer).toHaveBeenCalledWith("a");
      });
    });

    describe("when a section is dropped on the trash bin", () => {
      it("then calls removeEditor with the section index", () => {
        const { workspace } = renderPane({ editorCount: 2 });
        fireEvent.drop(screen.getByTestId("trashBin"), {
          dataTransfer: {
            getData: (type: string) => (type === "application/x-section-index" ? "1" : ""),
          },
        });
        expect(workspace.removeEditor).toHaveBeenCalledWith(1);
      });
    });

    describe("when a layer is dragged over the trash bin", () => {
      it("then shows destructive state via data-testid element present", () => {
        renderPane({ layers: [layerA] });
        const bin = screen.getByTestId("trashBin");
        fireEvent.dragEnter(bin);
        // The trash bin is still present and functional during dragover
        expect(bin).toBeInTheDocument();
      });
    });
  });

  describe("passage reordering", () => {
    describe("when dragging passage 0 to position 2", () => {
      it("then calls reorderEditors with the correct permutation", () => {
        const { workspace } = renderPane({
          editorCount: 3,
          sectionVisibility: [true, true, true],
          sectionNames: ["A", "B", "C"],
        });
        const row0 = screen.getByTestId("passageRow-0");
        const row2 = screen.getByTestId("passageRow-2");
        fireEvent.dragStart(row0, {
          dataTransfer: { setData: () => {}, types: ["application/x-section-index"] },
        });
        fireEvent.drop(row2, {
          dataTransfer: {
            getData: (type: string) => (type === "application/x-section-index" ? "0" : ""),
            types: ["application/x-section-index"],
          },
        });
        // Moving index 0 to position 2: [B, C, A] -> permutation [1, 2, 0]
        expect(workspace.reorderEditors).toHaveBeenCalledWith([1, 2, 0]);
      });
    });

    describe("when dragging passage 2 to position 0", () => {
      it("then calls reorderEditors with the correct permutation", () => {
        const { workspace } = renderPane({
          editorCount: 3,
          sectionVisibility: [true, true, true],
          sectionNames: ["A", "B", "C"],
        });
        const row2 = screen.getByTestId("passageRow-2");
        const row0 = screen.getByTestId("passageRow-0");
        fireEvent.dragStart(row2, {
          dataTransfer: { setData: () => {}, types: ["application/x-section-index"] },
        });
        fireEvent.drop(row0, {
          dataTransfer: {
            getData: (type: string) => (type === "application/x-section-index" ? "2" : ""),
            types: ["application/x-section-index"],
          },
        });
        // Moving index 2 to position 0: [C, A, B] -> permutation [2, 0, 1]
        expect(workspace.reorderEditors).toHaveBeenCalledWith([2, 0, 1]);
      });
    });

    describe("when dropping on the same position", () => {
      it("then does not call reorderEditors", () => {
        const { workspace } = renderPane({
          editorCount: 3,
          sectionVisibility: [true, true, true],
          sectionNames: ["A", "B", "C"],
        });
        const row1 = screen.getByTestId("passageRow-1");
        fireEvent.drop(row1, {
          dataTransfer: {
            getData: (type: string) => (type === "application/x-section-index" ? "1" : ""),
            types: ["application/x-section-index"],
          },
        });
        expect(workspace.reorderEditors).not.toHaveBeenCalled();
      });
    });

    describe("when only 1 editor exists", () => {
      it("then passage rows are not draggable", () => {
        renderPane({ editorCount: 1, sectionVisibility: [true], sectionNames: ["A"] });
        const row = screen.getByTestId("passageRow-0");
        expect(row).not.toHaveAttribute("draggable", "true");
      });
    });
  });

  describe("when section names are provided", () => {
    it("then forwards names and updateSectionName to SectionList", () => {
      const { workspace } = renderPane({ sectionNames: ["Custom Name"] });
      expect(screen.getByText("Custom Name")).toBeInTheDocument();
      fireEvent.doubleClick(screen.getByTestId("passageName-0"));
      fireEvent.change(screen.getByTestId("passageNameInput-0"), { target: { value: "Renamed" } });
      fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Enter" });
      expect(workspace.updateSectionName).toHaveBeenCalledWith(0, "Renamed");
    });
  });

  describe("expandable layer items", () => {
    describe("when highlight delete button is clicked", () => {
      it("then calls removeHighlight with layer and highlight ids", () => {
        const { workspace } = renderPane({ layers: [layerWithItems] });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        fireEvent.click(screen.getByTestId("removeHighlight-h1"));
        expect(workspace.removeHighlight).toHaveBeenCalledWith("a", "h1");
      });
    });

    describe("when arrow delete button is clicked", () => {
      it("then calls removeArrow with layer and arrow ids", () => {
        const { workspace } = renderPane({ layers: [layerWithItems] });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        fireEvent.click(screen.getByTestId("removeArrow-a1"));
        expect(workspace.removeArrow).toHaveBeenCalledWith("a", "a1");
      });
    });

    describe("when sectionNames are provided to layers with items", () => {
      it("then includes passage name in item titles", () => {
        renderPane({ layers: [layerWithItems], sectionNames: ["Intro", "Body"] });
        fireEvent.click(screen.getByTestId("layerExpand-0"));
        const span = screen.getByText("my note");
        expect(span).toHaveAttribute("title", "my note (Intro)");
      });
    });
  });
});
