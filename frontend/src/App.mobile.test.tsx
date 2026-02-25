import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

// Mobile — always mobile
vi.mock("./hooks/ui/use-is-breakpoint", () => ({
  useIsBreakpoint: () => true,
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

// Mock EditorPane — renders testable attributes
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
    />
  ),
  SIMPLE_EDITOR_CONTENT: {},
}));

vi.mock("./components/AnnotationPanel", () => ({
  AnnotationPanel: (props: Record<string, unknown>) => (
    <div data-testid="annotation-panel" data-placement={props.placement} />
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

describe("App (mobile)", () => {
  describe("when rendered on a mobile viewport", () => {
    it("hides the sidebar button pane", () => {
      renderApp();
      expect(screen.queryByTestId("buttonPane")).not.toBeInTheDocument();
    });

    it("hides the status bar", () => {
      renderApp();
      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument();
    });

    it("shows the mobile info dialog", () => {
      renderApp();
      expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument();
      expect(screen.getByText("Best on Desktop")).toBeInTheDocument();
    });
  });

  describe("when the mobile info dialog is dismissed", () => {
    it("hides the dialog after clicking close", async () => {
      const user = userEvent.setup();
      renderApp();

      expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(screen.queryByTestId("mobileInfoDialog")).not.toBeInTheDocument();
    });
  });

  describe("when viewing editors on mobile (read-only)", () => {
    it("renders editors as locked regardless of lock setting", () => {
      mockWorkspace.settings.isLocked = false;
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-locked", "true");
    });

    it("does not enable annotation mouse handlers even when locked", () => {
      mockWorkspace.settings.isLocked = true;
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-has-mouse-handlers", "false");
    });

    it("does not enable content editing", () => {
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-has-content-update", "false");
    });
  });
});
