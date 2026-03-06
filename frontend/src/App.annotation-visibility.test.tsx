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
      visible?: boolean;
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

describe("App annotation visibility (layer toggles)", () => {
  it("when layer is hidden, then its annotations disappear (no annotation panel)", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "Layer 1 note")],
      }),
    ];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when layer is visible, then its annotations are shown (annotation panel renders)", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Layer 1 note")],
      }),
    ];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when layer is shown again, then its annotations are restored", () => {
    // First render with visible layer
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Restored note")],
      }),
    ];
    const { unmount } = renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    unmount();

    // Hide the layer
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "Restored note")],
      }),
    ];
    const { unmount: unmount2 } = renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    unmount2();

    // Show the layer again
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Restored note")],
      }),
    ];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when one layer is hidden, then annotations on other layers remain visible", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "L1 annotation")],
      }),
      makeLayer("layer-2", "Layer 2", {
        visible: true,
        highlights: [makeComment("h2", 0, "L2 annotation")],
      }),
    ];
    renderApp();
    // Panel is still shown because layer-2 is visible and has comments
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when all layers are hidden, then annotation panel disappears", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "Only note")],
      }),
    ];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });
});

describe("App annotation visibility (text toggles)", () => {
  it("when text is hidden, then its annotations disappear", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Text 1 note")],
      }),
    ];
    mockDocument.sectionVisibility = [false, true];
    renderApp();
    // Annotation is in text 0, which is hidden
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when text is shown again, then its annotations are restored", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Restored text note")],
      }),
    ];

    // First with text visible
    mockDocument.sectionVisibility = [true, true];
    const { unmount } = renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    unmount();

    // Hide text
    mockDocument.sectionVisibility = [false, true];
    const { unmount: unmount2 } = renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    unmount2();

    // Show text again
    mockDocument.sectionVisibility = [true, true];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when one text is hidden, then annotations in other texts remain visible", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "P1 note"), makeComment("h2", 1, "P2 note")],
      }),
    ];
    mockDocument.sectionVisibility = [false, true];
    renderApp();
    // Panel still shows because text 1 has a visible comment
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when all texts are hidden, then annotation panel disappears", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "P1 note"), makeComment("h2", 1, "P2 note")],
      }),
    ];
    mockDocument.sectionVisibility = [false, false];
    renderApp();
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });
});

describe("App annotation visibility (combined layer + text toggles)", () => {
  it("when layer is hidden then text is hidden, showing layer alone does not restore annotations", () => {
    // Layer hidden, text hidden => no annotations
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Combined note")],
      }),
    ];
    mockDocument.sectionVisibility = [false, true];
    renderApp();
    // Text 0 hidden => annotation in editorIndex 0 is not visible
    expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
  });

  it("when both layer and text are visible, then annotations appear", () => {
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "Combined note")],
      }),
    ];
    mockDocument.sectionVisibility = [true, true];
    renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });

  it("when layers and texts are toggled independently, then annotations respect both visibility states", () => {
    // Layer 1 visible, layer 2 visible; text 0 visible, text 1 visible
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "L1P1"), makeComment("h2", 1, "L1P2")],
      }),
      makeLayer("layer-2", "Layer 2", {
        visible: true,
        highlights: [makeComment("h3", 0, "L2P1")],
      }),
    ];
    mockDocument.sectionVisibility = [true, true];
    const { unmount } = renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    unmount();

    // Hide layer 1 => only L2P1 remains (in text 0)
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: false,
        highlights: [makeComment("h1", 0, "L1P1"), makeComment("h2", 1, "L1P2")],
      }),
      makeLayer("layer-2", "Layer 2", {
        visible: true,
        highlights: [makeComment("h3", 0, "L2P1")],
      }),
    ];
    const { unmount: unmount2 } = renderApp();
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    unmount2();

    // Show layer 1, hide text 0 => L1P1 and L2P1 hidden, L1P2 visible
    mockDocument.layers = [
      makeLayer("layer-1", "Layer 1", {
        visible: true,
        highlights: [makeComment("h1", 0, "L1P1"), makeComment("h2", 1, "L1P2")],
      }),
      makeLayer("layer-2", "Layer 2", {
        visible: true,
        highlights: [makeComment("h3", 0, "L2P1")],
      }),
    ];
    mockDocument.sectionVisibility = [false, true];
    renderApp();
    // L1P2 is in text 1 (visible) on layer 1 (visible) => panel should show
    expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
  });
});
