import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "./contexts/AuthContext";
import { TourProvider } from "./contexts/TourContext";
import { App } from "./App";

vi.mock("@/lib/auth-client", () => ({
  fetchAuthStatus: vi.fn().mockResolvedValue({ authenticated: false }),
  loginWith: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/lib/tour-client", () => ({
  fetchTourPreferences: vi.fn().mockResolvedValue({}),
  saveTourPreference: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./hooks/ui/use-is-breakpoint", () => ({
  useIsBreakpoint: () => false,
}));

const mockDocument = {
  settings: {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    lockedPanes: { 0: true, 1: true, 2: true, 3: true } as Record<number, boolean>,
    showStatusBar: true,
    hideOffscreenArrows: false,
    commentPlacement: "right" as const,
  },
  isPaneLocked: (i: number) => mockDocument.settings.lockedPanes[i] ?? true,
  isAnyPaneLocked: true,
  activeEditorIndex: 0,
  annotations: { activeTool: "selection" as const },
  layers: [] as {
    id: string;
    color: string;
    name: string;
    visible: boolean;
    arrowStyle: string;
    highlights: {
      id: string;
      editorIndex: number;
      from: number;
      to: number;
      text: string;
      annotation: string;
      type: string;
    }[];
    arrows: {
      id: string;
      from: { editorIndex: number; from: number; to: number; text: string };
      to: { editorIndex: number; from: number; to: number; text: string };
      visible?: boolean;
    }[];
    underlines: unknown[];
  }[],
  activeLayerId: null as string | null,
  editorCount: 2,
  activeEditor: null,
  editorWidths: [50, 50],
  isManagementPaneOpen: false,
  toggleDarkMode: vi.fn(),
  toggleLayersOn: vi.fn(),
  toggleMultipleRowsLayout: vi.fn(),
  toggleLocked: vi.fn(),
  setActiveTool: vi.fn(),
  setArrowStylePickerOpen: vi.fn(),
  arrowStylePickerOpen: false,
  activeArrowStyle: "solid" as const,
  setActiveArrowStyle: vi.fn(),
  selectedArrow: null as { layerId: string; arrowId: string } | null,
  setSelectedArrow: vi.fn(),
  updateArrowStyle: vi.fn(),
  readOnly: false,
  columnSplit: 50,
  rowSplit: 50,
  handleColumnResize: vi.fn(),
  handleRowResize: vi.fn(),
  toggleManagementPane: vi.fn(),
  toggleHideOffscreenArrows: vi.fn(),
  toggleShowStatusBar: vi.fn(),
  toggleCommentPlacement: vi.fn(),

  loadDemoContent: vi.fn(),
  demoLoaded: false,
  demoLoading: false,
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  setActiveLayer: vi.fn(),
  updateLayerColor: vi.fn(),
  updateLayerName: vi.fn(),
  toggleLayerVisibility: vi.fn(),
  toggleAllLayerVisibility: vi.fn(),
  addHighlight: vi.fn(),
  removeHighlight: vi.fn(),
  updateHighlightAnnotation: vi.fn(),
  addReply: vi.fn(),
  updateReply: vi.fn(),
  removeReply: vi.fn(),
  toggleReactionOnHighlight: vi.fn(),
  toggleReactionOnReply: vi.fn(),
  clearLayerHighlights: vi.fn(),
  addArrow: vi.fn(),
  removeArrow: vi.fn(),
  clearLayerArrows: vi.fn(),
  clearLayerUnderlines: vi.fn(),
  addUnderline: vi.fn(),
  removeUnderline: vi.fn(),
  toggleHighlightVisibility: vi.fn(),
  toggleArrowVisibility: vi.fn(),
  toggleUnderlineVisibility: vi.fn(),
  setActiveLayerId: vi.fn(),
  editorsRef: { current: new Map() },
  sectionVisibility: [true, true],
  sectionNames: ["Text 1", "Text 2"],
  editorKeys: [1, 2],
  addEditor: vi.fn(),
  removeEditor: vi.fn(),
  reorderEditors: vi.fn(),
  updateSectionName: vi.fn(),
  toggleSectionVisibility: vi.fn(),
  toggleAllSectionVisibility: vi.fn(),
  handleDividerResize: vi.fn(),
  handleEditorMount: vi.fn(),
  handlePaneFocus: vi.fn(),
  history: {
    log: [],
    canUndo: false,
    canRedo: false,
    undo: vi.fn(),
    redo: vi.fn(),
    record: vi.fn(),
  },
  wsConnected: false,
  documentId: "test-document",
  yjs: {
    provider: null,
    doc: null,
    connected: false,
    synced: false,
    getFragment: () => null,
    awareness: null,
  },
  unifiedUndo: {
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: false,
    canRedo: false,
  },
};

vi.mock("./hooks/data/use-editor-document", () => ({
  useEditorDocument: () => mockDocument,
}));

vi.mock("./hooks/data/use-document-autosave", () => ({
  useDocumentAutosave: vi.fn(),
}));

vi.mock("./components/UnsavedBanner", () => ({
  UnsavedBanner: () => <div data-testid="unsaved-banner" />,
}));

vi.mock("@tiptap/react", () => ({
  useEditor: () => null,
  useCurrentEditor: () => ({ editor: null }),
  EditorContent: (props: Record<string, unknown>) => (
    <div data-testid="editor-content" {...props} />
  ),
  EditorContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

vi.mock("./components/tiptap-templates/simple", () => ({
  TitleBar: () => <div data-testid="title-bar" />,
  SimpleEditorToolbar: () => <div data-testid="toolbar" />,
  EditorPane: (props: Record<string, unknown>) => (
    <div
      data-testid="editor-pane"
      data-locked={String(props.isLocked ?? false)}
      data-index={props.index}
      data-layer-count={Array.isArray(props.layers) ? (props.layers as unknown[]).length : 0}
      data-section-visibility={JSON.stringify(props.sectionVisibility)}
    />
  ),
  SIMPLE_EDITOR_CONTENT: {},
}));

vi.mock("./components/AnnotationPanel", () => ({
  AnnotationPanel: (props: Record<string, unknown>) => (
    <div data-testid="annotation-panel" data-placement={props.placement} />
  ),
  DEFAULT_PANEL_WIDTH: 224,
  MIN_PANEL_WIDTH: 160,
  MAX_PANEL_WIDTH: 400,
}));

const defaultProps = {
  documentId: "test-document",
  navigate: vi.fn(),
};

function renderApp() {
  return render(
    <AuthProvider>
      <TourProvider>
        <App {...defaultProps} />
      </TourProvider>
    </AuthProvider>,
  );
}

function makeLayer(
  id: string,
  name: string,
  opts: {
    visible?: boolean;
    highlights?: {
      id: string;
      editorIndex: number;
      from: number;
      to: number;
      text: string;
      annotation: string;
      type: string;
    }[];
    arrows?: {
      id: string;
      from: { editorIndex: number; from: number; to: number; text: string };
      to: { editorIndex: number; from: number; to: number; text: string };
    }[];
  } = {},
) {
  return {
    id,
    name,
    color: "#fca5a5",
    visible: opts.visible ?? true,
    arrowStyle: "solid",
    highlights: opts.highlights ?? [],
    arrows: opts.arrows ?? [],
    underlines: [],
  };
}

function makeComment(id: string, editorIndex: number, text: string) {
  return {
    id,
    editorIndex,
    from: 0,
    to: 5,
    text: "word",
    annotation: text,
    type: "comment",
  };
}

function makeArrow(id: string, sourceEditor: number, targetEditor: number) {
  return {
    id,
    from: { editorIndex: sourceEditor, from: 0, to: 3, text: "foo" },
    to: { editorIndex: targetEditor, from: 10, to: 13, text: "bar" },
  };
}

beforeEach(() => {
  mockDocument.settings = {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    lockedPanes: { 0: true, 1: true, 2: true, 3: true } as Record<number, boolean>,
    showStatusBar: true,
    hideOffscreenArrows: false,
    commentPlacement: "right" as const,
  };
  mockDocument.isAnyPaneLocked = true;
  mockDocument.layers = [];
  mockDocument.activeLayerId = null;
  mockDocument.editorCount = 2;
  mockDocument.editorWidths = [50, 50];
  mockDocument.editorKeys = [1, 2];
  mockDocument.sectionVisibility = [true, true];
  mockDocument.sectionNames = ["Text 1", "Text 2"];
  mockDocument.isManagementPaneOpen = false;
  mockDocument.annotations = { activeTool: "selection" as const };
  mockDocument.selectedArrow = null;
  mockDocument.demoLoading = false;
});

describe("App multi-editor layers", () => {
  describe("when working with cross-editor layers", () => {
    it("then layers are passed to all editor panes", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          arrows: [makeArrow("a1", 0, 1)],
        }),
      ];
      renderApp();
      const panes = screen.getAllByTestId("editor-pane");
      expect(panes).toHaveLength(2);
      // Both panes receive the same layer data
      panes.forEach((pane) => {
        expect(pane).toHaveAttribute("data-layer-count", "1");
      });
    });

    it("when arrows exist on different layers, then all layers are passed to panes", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          arrows: [makeArrow("a1", 0, 0)],
        }),
        makeLayer("layer-2", "Layer 2", {
          arrows: [makeArrow("a2", 1, 1)],
        }),
      ];
      renderApp();
      const panes = screen.getAllByTestId("editor-pane");
      panes.forEach((pane) => {
        expect(pane).toHaveAttribute("data-layer-count", "2");
      });
    });

    it("when one layer is hidden, then hidden layer is still passed to panes (filtering happens inside EditorPane)", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          visible: true,
          arrows: [makeArrow("a1", 0, 0)],
        }),
        makeLayer("layer-2", "Layer 2", {
          visible: false,
          arrows: [makeArrow("a2", 1, 1)],
        }),
      ];
      renderApp();
      const panes = screen.getAllByTestId("editor-pane");
      // App passes all layers; EditorPane does visibility filtering
      panes.forEach((pane) => {
        expect(pane).toHaveAttribute("data-layer-count", "2");
      });
    });
  });

  describe("when toggling section visibility with layers", () => {
    it("when a text is hidden, then its editor pane is not displayed", () => {
      mockDocument.sectionVisibility = [true, false];
      renderApp();
      const panes = screen.getAllByTestId("editor-pane");
      // Both panes are rendered, but the hidden one's container has display:none
      expect(panes).toHaveLength(2);
      // The second pane's parent container should have display:none
      const secondPane = panes.find((p) => p.getAttribute("data-index") === "1");
      expect(secondPane).toBeDefined();
      expect(secondPane!.closest('[style*="display: none"]')).not.toBeNull();
    });

    it("when text is shown again, then its editor pane is visible", () => {
      mockDocument.sectionVisibility = [true, true];
      renderApp();
      const panes = screen.getAllByTestId("editor-pane");
      const secondPane = panes.find((p) => p.getAttribute("data-index") === "1");
      expect(secondPane).toBeDefined();
      // No parent with display:none
      expect(secondPane!.closest('[style*="display: none"]')).toBeNull();
    });

    it("when text with annotations is hidden, then annotation panel reflects visibility", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          visible: true,
          highlights: [makeComment("h1", 1, "P2 note")],
        }),
      ];
      // Hide text 1 where the annotation is
      mockDocument.sectionVisibility = [true, false];
      renderApp();
      expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    });

    it("when annotations exist in visible text only, then annotation panel shows", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          visible: true,
          highlights: [makeComment("h1", 0, "P1 note")],
        }),
      ];
      mockDocument.sectionVisibility = [true, false];
      renderApp();
      expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    });
  });

  describe("when highlights coexist across editors", () => {
    it("when highlights exist on different layers in different editors, then all layers are passed", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          visible: true,
          highlights: [makeComment("h1", 0, "E1 note")],
        }),
        makeLayer("layer-2", "Layer 2", {
          visible: true,
          highlights: [makeComment("h2", 1, "E2 note")],
        }),
      ];
      renderApp();
      const panes = screen.getAllByTestId("editor-pane");
      panes.forEach((pane) => {
        expect(pane).toHaveAttribute("data-layer-count", "2");
      });
      // Annotation panel shows
      expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    });

    it("when one layer is hidden, then its highlights do not contribute to annotation panel visibility", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          visible: false,
          highlights: [makeComment("h1", 0, "E1 note")],
        }),
        makeLayer("layer-2", "Layer 2", {
          visible: true,
          highlights: [makeComment("h2", 1, "E2 note")],
        }),
      ];
      renderApp();
      // Only layer-2 is visible, panel still shows
      expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    });

    it("when both layers are hidden, then annotation panel disappears", () => {
      mockDocument.layers = [
        makeLayer("layer-1", "Layer 1", {
          visible: false,
          highlights: [makeComment("h1", 0, "E1 note")],
        }),
        makeLayer("layer-2", "Layer 2", {
          visible: false,
          highlights: [makeComment("h2", 1, "E2 note")],
        }),
      ];
      renderApp();
      expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    });
  });

  describe("when section visibility is passed to editor panes", () => {
    it("then each editor pane receives the correct sectionVisibility", () => {
      mockDocument.sectionVisibility = [true, false];
      renderApp();
      const panes = screen.getAllByTestId("editor-pane");
      panes.forEach((pane) => {
        expect(pane).toHaveAttribute("data-section-visibility", JSON.stringify([true, false]));
      });
    });
  });
});
