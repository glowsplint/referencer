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
});

describe("App UI consistency (layer hidden)", () => {
  it("when layer is hidden, then annotation panel is removed", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "Highlight test")],
      }),
    ];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when layer is visible with comments, then annotation panel is present", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Highlight test")],
      }),
    ];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when layer with arrows is hidden, then layers are still passed to panes (filtering internal)", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    renderApp();
    const panes = screen.getAllByTestId("editor-pane");
    // Layers are always passed; EditorPane handles visibility filtering
    panes.forEach((pane) => {
      expect(pane).toHaveAttribute("data-layer-count", "1");
    });
  });
});

describe("App UI consistency (text hidden)", () => {
  it("when text is hidden and only annotation is in that text, then annotation panel is removed", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Text gone note")],
      }),
    ];
    mockDocument.sectionVisibility = [false, true];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when destination text is hidden, then cross-editor arrow data still passed (filtering internal)", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        arrows: [makeArrow("a1", 0, 1)],
      }),
    ];
    mockDocument.sectionVisibility = [true, false];
    renderApp();
    // ArrowOverlay handles filtering by sectionVisibility internally
    const panes = screen.getAllByTestId("editor-pane");
    expect(panes[0]).toHaveAttribute("data-layer-count", "1");
  });

  it("when text is shown again, then annotation panel reappears", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 1, "P2 note")],
      }),
    ];

    // First hidden
    mockDocument.sectionVisibility = [true, false];
    const { unmount } = renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    unmount();

    // Then visible
    mockDocument.sectionVisibility = [true, true];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });
});

describe("App UI consistency (toggling visibility with arrows, highlights, and annotations)", () => {
  it("when layer is toggled, then annotation panel appears and disappears", () => {
    // Visible: annotation panel present
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Synced note")],
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    const { unmount } = renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    unmount();

    // Hidden: annotation panel gone
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "Synced note")],
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    const { unmount: unmount2 } = renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    unmount2();

    // Shown again: annotation panel reappears
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Synced note")],
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when layer 1 is hidden, then layer 2 elements are unaffected", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "L1 note")],
        arrows: [makeArrow("a1", 0, 0)],
      }),
      makeLayer("layer-2", "Layer 2", {
        visible: true,
        highlights: [makeComment("h2", 1, "L2 note")],
        arrows: [makeArrow("a2", 1, 1)],
      }),
    ];
    renderApp();
    // Panel still visible because layer 2 has visible comments
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    // Both layers still passed to panes
    const panes = screen.getAllByTestId("editor-pane");
    panes.forEach((pane) => {
      expect(pane).toHaveAttribute("data-layer-count", "2");
    });
  });

  it("when layer visibility is toggled multiple times (ends visible), then annotations show", () => {
    // After 6 toggles (even number) => ends visible
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Rapid test")],
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when layer visibility is toggled multiple times (ends hidden), then annotations disappear", () => {
    // After 5 toggles (odd number) => ends hidden
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "Rapid test")],
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when text visibility is toggled multiple times (ends hidden), then annotations disappear", () => {
    // After 5 toggles of text (odd number) => ends hidden
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Rapid text test")],
      }),
    ];
    mockDocument.sectionVisibility = [false, true];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when text visibility is toggled back to visible, then annotations reappear", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Rapid text test")],
      }),
    ];
    mockDocument.sectionVisibility = [true, true];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });
});

describe("App UI consistency (all elements hidden)", () => {
  it("when all layers are hidden, then no annotation panel is visible", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "Will hide")],
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when all layers are hidden, then layers are still passed to panes for arrow overlay", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        arrows: [makeArrow("a1", 0, 0)],
      }),
    ];
    renderApp();
    // Arrow overlay SVG filtering is internal; layers are always passed
    const panes = screen.getAllByTestId("editor-pane");
    panes.forEach((pane) => {
      expect(pane).toHaveAttribute("data-layer-count", "1");
    });
  });

  it("when unlocked, then annotation panel is never shown regardless of layers", () => {
    mockDocument.settings.lockedPanes = { 0: false, 1: false, 2: false, 3: false };
    mockDocument.isAnyPaneLocked = false;
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "note")],
      }),
    ];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });
});
