import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "./contexts/AuthContext";
import { TourProvider } from "./contexts/TourContext";
import { App } from "./App";

// Mock auth and tour API clients
vi.mock("@/lib/auth-client", () => ({
  fetchAuthStatus: vi.fn().mockResolvedValue({ authenticated: false }),
  loginWith: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/lib/tour-client", () => ({
  fetchTourPreferences: vi.fn().mockResolvedValue({}),
  saveTourPreference: vi.fn().mockResolvedValue(undefined),
}));

// Desktop — never mobile
vi.mock("./hooks/ui/use-is-breakpoint", () => ({
  useIsBreakpoint: () => false,
}));

// Mock the editor workspace hook
const mockWorkspace = {
  settings: {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
    overscrollEnabled: false,
    showStatusBar: true,
    hideOffscreenArrows: false,
    commentPlacement: "right" as const,
  },
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
    arrows: unknown[];
    underlines: unknown[];
  }[],
  activeLayerId: null as string | null,
  editorCount: 1,
  activeEditor: null,
  editorWidths: [100],
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
  toggleManagementPane: vi.fn(),
  toggleOverscrollEnabled: vi.fn(),
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
  updateEditorContent: vi.fn(),
  setActiveLayerId: vi.fn(),
  setLayers: vi.fn(),
  editorsRef: { current: new Map() },
  sectionVisibility: [true],
  sectionNames: ["Passage 1"],
  editorKeys: [1],
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
  workspaceId: "test-workspace",
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

vi.mock("./hooks/data/use-editor-workspace", () => ({
  useEditorWorkspace: () => mockWorkspace,
}));

vi.mock("./hooks/data/use-workspace-autosave", () => ({
  useWorkspaceAutosave: vi.fn(),
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

// Mock EditorPane — renders testable attributes instead of capturing props
vi.mock("./components/tiptap-templates/simple", () => ({
  TitleBar: () => <div data-testid="title-bar" />,
  SimpleEditorToolbar: () => <div data-testid="toolbar" />,
  EditorPane: (props: Record<string, unknown>) => (
    <div
      data-testid="editor-pane"
      data-locked={String(props.isLocked ?? false)}
      data-has-mouse-handlers={String(
        props.onMouseDown !== undefined &&
          props.onMouseMove !== undefined &&
          props.onMouseUp !== undefined,
      )}
      data-has-content-update={String(props.onContentUpdate !== undefined)}
      data-index={props.index}
      data-layer-count={Array.isArray(props.layers) ? (props.layers as unknown[]).length : 0}
    />
  ),
  SIMPLE_EDITOR_CONTENT: {},
}));

// Mock AnnotationPanel — renders testable attributes
vi.mock("./components/AnnotationPanel", () => ({
  AnnotationPanel: (props: Record<string, unknown>) => (
    <div
      data-testid="annotation-panel"
      data-placement={props.placement}
      data-has-handlers={String(
        props.onAnnotationChange !== undefined &&
          props.onAnnotationBlur !== undefined &&
          props.onAnnotationClick !== undefined,
      )}
    />
  ),
}));

beforeEach(() => {
  mockWorkspace.settings = {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    isLocked: false,
    overscrollEnabled: false,
    showStatusBar: true,
    hideOffscreenArrows: false,
    commentPlacement: "right" as const,
  };
  mockWorkspace.layers = [];
  mockWorkspace.activeLayerId = null;
  mockWorkspace.editorWidths = [100];
  mockWorkspace.editorKeys = [1];
  mockWorkspace.sectionVisibility = [true];
  mockWorkspace.isManagementPaneOpen = false;
  mockWorkspace.annotations = { activeTool: "selection" as const };
  mockWorkspace.selectedArrow = null;
});

const defaultProps = {
  workspaceId: "test-workspace",
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

const LAYER_WITH_COMMENT = {
  id: "layer-1",
  name: "Layer 1",
  color: "#fca5a5",
  visible: true,
  arrowStyle: "solid",
  highlights: [
    {
      id: "h1",
      editorIndex: 0,
      from: 0,
      to: 5,
      text: "hello",
      annotation: "note",
      type: "comment",
    },
  ],
  arrows: [],
  underlines: [],
};

describe("App (desktop)", () => {
  describe("when rendered with default settings", () => {
    it("shows the sidebar button pane", () => {
      renderApp();
      expect(screen.getByTestId("buttonPane")).toBeInTheDocument();
      expect(screen.getByTestId("menuButton")).toBeInTheDocument();
      expect(screen.getByTestId("settingsButton")).toBeInTheDocument();
      expect(screen.getByTestId("lockButton")).toBeInTheDocument();
    });

    it("shows the title bar and editor toolbar", () => {
      renderApp();
      expect(screen.getByTestId("title-bar")).toBeInTheDocument();
      expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    });

    it("shows the status bar", () => {
      renderApp();
      expect(screen.getByTestId("status-bar")).toBeInTheDocument();
    });

    it("renders one editor pane", () => {
      renderApp();
      expect(screen.getAllByTestId("editor-pane")).toHaveLength(1);
    });
  });

  describe("when the management pane is closed", () => {
    it("does not show the management pane", () => {
      renderApp();
      expect(screen.queryByTestId("managementPane")).not.toBeInTheDocument();
    });
  });

  describe("when the management pane is open", () => {
    it("shows the management pane", () => {
      mockWorkspace.isManagementPaneOpen = true;
      renderApp();
      expect(screen.getByTestId("managementPane")).toBeInTheDocument();
    });
  });

  describe("when multiple editor panes are configured", () => {
    it("renders one pane per editor width", () => {
      mockWorkspace.editorWidths = [50, 50];
      mockWorkspace.editorKeys = [1, 2];
      mockWorkspace.sectionVisibility = [true, true];
      renderApp();
      expect(screen.getAllByTestId("editor-pane")).toHaveLength(2);
    });
  });

  describe("when unlocked (editing mode)", () => {
    it("renders editors without annotation mouse handlers", () => {
      mockWorkspace.settings.isLocked = false;
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-has-mouse-handlers", "false");
    });

    it("renders editors with content update enabled", () => {
      mockWorkspace.settings.isLocked = false;
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-has-content-update", "true");
    });

    it("does not show the annotation panel even with comments", () => {
      mockWorkspace.settings.isLocked = false;
      mockWorkspace.layers = [LAYER_WITH_COMMENT];
      renderApp();
      expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    });
  });

  describe("when locked (annotation mode)", () => {
    beforeEach(() => {
      mockWorkspace.settings.isLocked = true;
    });

    it("renders editors with annotation mouse handlers", () => {
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-has-mouse-handlers", "true");
    });

    it("renders editors as locked", () => {
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-locked", "true");
    });

    it("does not show annotation panel when there are no comment annotations", () => {
      mockWorkspace.layers = [];
      renderApp();
      expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    });
  });

  describe("when locked with comment annotations", () => {
    beforeEach(() => {
      mockWorkspace.settings.isLocked = true;
      mockWorkspace.layers = [LAYER_WITH_COMMENT];
    });

    it("shows the annotation panel", () => {
      renderApp();
      expect(screen.getByTestId("annotation-panel")).toBeInTheDocument();
    });

    it("renders the annotation panel with editing handlers", () => {
      renderApp();
      const panel = screen.getByTestId("annotation-panel");
      expect(panel).toHaveAttribute("data-has-handlers", "true");
    });

    it("places the annotation panel on the right by default", () => {
      renderApp();
      const panel = screen.getByTestId("annotation-panel");
      expect(panel).toHaveAttribute("data-placement", "right");
    });

    it("places the annotation panel on the left when configured", () => {
      mockWorkspace.settings.commentPlacement = "left";
      renderApp();
      const panel = screen.getByTestId("annotation-panel");
      expect(panel).toHaveAttribute("data-placement", "left");
    });

    it("hides annotation panel when all annotated passages are hidden", () => {
      mockWorkspace.sectionVisibility = [false];
      renderApp();
      expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    });

    it("hides annotation panel when the layer is not visible", () => {
      mockWorkspace.layers = [{ ...LAYER_WITH_COMMENT, visible: false }];
      renderApp();
      expect(screen.queryByTestId("annotation-panel")).not.toBeInTheDocument();
    });
  });

  describe("when a tool mode is active while locked", () => {
    beforeEach(() => {
      mockWorkspace.settings.isLocked = true;
    });

    it("applies eraser cursor class to editor container", () => {
      mockWorkspace.annotations = { activeTool: "eraser" as const };
      renderApp();
      const container = screen.getByTestId("editorContainer");
      expect(container.className).toContain("eraser-mode-container");
    });

    it("applies highlight cursor class to editor container", () => {
      mockWorkspace.annotations = { activeTool: "highlight" as const };
      renderApp();
      const container = screen.getByTestId("editorContainer");
      expect(container.className).toContain("highlight-mode-container");
    });

    it("applies comment cursor class to editor container", () => {
      mockWorkspace.annotations = { activeTool: "comments" as const };
      renderApp();
      const container = screen.getByTestId("editorContainer");
      expect(container.className).toContain("comment-mode-container");
    });

    it("does not apply tool cursor classes when using selection tool", () => {
      mockWorkspace.annotations = { activeTool: "selection" as const };
      renderApp();
      const container = screen.getByTestId("editorContainer");
      expect(container.className).not.toContain("eraser-mode-container");
      expect(container.className).not.toContain("highlight-mode-container");
      expect(container.className).not.toContain("comment-mode-container");
    });
  });

  describe("when layers have data", () => {
    it("passes layer count to editor panes", () => {
      mockWorkspace.layers = [LAYER_WITH_COMMENT];
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-layer-count", "1");
    });
  });

  describe("when status bar is disabled", () => {
    it("does not show the status bar", () => {
      mockWorkspace.settings.showStatusBar = false;
      renderApp();
      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument();
    });
  });
});
