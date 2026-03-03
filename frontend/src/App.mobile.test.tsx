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
    lockedPanes: { 0: false, 1: false, 2: false, 3: false } as Record<number, boolean>,
    showStatusBar: true,
    hideOffscreenArrows: false,
    commentPlacement: "right" as const,
  },
  isPaneLocked: (i: number) => mockWorkspace.settings.lockedPanes[i] ?? true,
  isAnyPaneLocked: false,
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
  togglePaneLocked: vi.fn(),
  toggleFocusedPaneLocked: vi.fn(),
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
    />
  ),
  SIMPLE_EDITOR_CONTENT: {},
}));

vi.mock("./components/AnnotationPanel", () => ({
  AnnotationPanel: (props: Record<string, unknown>) => (
    <div
      data-testid="annotation-panel"
      data-placement={props.placement}
      data-read-only={String(props.readOnly ?? false)}
    />
  ),
  DEFAULT_PANEL_WIDTH: 224,
  MIN_PANEL_WIDTH: 160,
  MAX_PANEL_WIDTH: 400,
}));

beforeEach(() => {
  mockWorkspace.settings = {
    isDarkMode: false,
    isLayersOn: false,
    isMultipleRowsLayout: false,
    lockedPanes: { 0: false, 1: false, 2: false, 3: false },
    showStatusBar: true,
    hideOffscreenArrows: false,
    commentPlacement: "right" as const,
  };
  mockWorkspace.isAnyPaneLocked = false;
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
    it("then hides the sidebar button pane", () => {
      renderApp();
      expect(screen.queryByTestId("buttonPane")).not.toBeInTheDocument();
    });

    it("then hides the status bar", () => {
      renderApp();
      expect(screen.queryByTestId("status-bar")).not.toBeInTheDocument();
    });

    it("then shows the mobile info dialog", () => {
      renderApp();
      expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument();
      expect(screen.getByText("Best on Desktop")).toBeInTheDocument();
    });
  });

  describe("when the mobile info dialog is dismissed", () => {
    it("then hides the dialog after clicking close", async () => {
      const user = userEvent.setup();
      renderApp();

      expect(screen.getByTestId("mobileInfoDialog")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close" }));
      expect(screen.queryByTestId("mobileInfoDialog")).not.toBeInTheDocument();
    });
  });

  describe("when viewing editors on mobile (read-only)", () => {
    it("then renders editors as locked regardless of lock setting", () => {
      mockWorkspace.settings.lockedPanes = { 0: false, 1: false, 2: false, 3: false };
      mockWorkspace.isAnyPaneLocked = false;
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-locked", "true");
    });

    it("then does not enable annotation mouse handlers even when locked", () => {
      mockWorkspace.settings.lockedPanes = { 0: true, 1: true, 2: true, 3: true };
      mockWorkspace.isAnyPaneLocked = true;
      renderApp();
      const pane = screen.getByTestId("editor-pane");
      expect(pane).toHaveAttribute("data-has-mouse-handlers", "false");
    });
  });

  describe("mobile annotation panel", () => {
    const layerWithComment = {
      id: "layer-1",
      color: "#ff0000",
      name: "Layer 1",
      visible: true,
      arrowStyle: "solid",
      highlights: [
        {
          id: "h-1",
          editorIndex: 0,
          from: 0,
          to: 5,
          text: "Hello",
          annotation: "A comment",
          type: "comment",
        },
      ],
      arrows: [],
      underlines: [],
    };

    it("does not show the toggle button when not locked", () => {
      mockWorkspace.settings.lockedPanes = { 0: false, 1: false, 2: false, 3: false };
      mockWorkspace.isAnyPaneLocked = false;
      mockWorkspace.layers = [layerWithComment];
      renderApp();
      expect(screen.queryByTestId("mobileAnnotationToggle")).not.toBeInTheDocument();
    });

    it("does not show the toggle button when locked but no annotations", () => {
      mockWorkspace.settings.lockedPanes = { 0: true, 1: true, 2: true, 3: true };
      mockWorkspace.isAnyPaneLocked = true;
      mockWorkspace.layers = [];
      renderApp();
      expect(screen.queryByTestId("mobileAnnotationToggle")).not.toBeInTheDocument();
    });

    it("shows the toggle button when locked with comment annotations", () => {
      mockWorkspace.settings.lockedPanes = { 0: true, 1: true, 2: true, 3: true };
      mockWorkspace.isAnyPaneLocked = true;
      mockWorkspace.layers = [layerWithComment];
      renderApp();
      expect(screen.getByTestId("mobileAnnotationToggle")).toBeInTheDocument();
    });

    it("opens the annotation drawer when the toggle button is clicked", async () => {
      const user = userEvent.setup();
      mockWorkspace.settings.lockedPanes = { 0: true, 1: true, 2: true, 3: true };
      mockWorkspace.isAnyPaneLocked = true;
      mockWorkspace.layers = [layerWithComment];
      renderApp();

      // Dismiss the mobile info dialog first
      await user.click(screen.getByRole("button", { name: "Close" }));

      await user.click(screen.getByTestId("mobileAnnotationToggle"));
      expect(screen.getByTestId("mobileAnnotationDrawer")).toBeInTheDocument();
      // Toggle button should be hidden when drawer is open
      expect(screen.queryByTestId("mobileAnnotationToggle")).not.toBeInTheDocument();
    });

    it("renders the annotation panel in read-only mode inside the drawer", async () => {
      const user = userEvent.setup();
      mockWorkspace.settings.lockedPanes = { 0: true, 1: true, 2: true, 3: true };
      mockWorkspace.isAnyPaneLocked = true;
      mockWorkspace.layers = [layerWithComment];
      renderApp();

      // Dismiss the mobile info dialog first
      await user.click(screen.getByRole("button", { name: "Close" }));

      await user.click(screen.getByTestId("mobileAnnotationToggle"));
      const panel = screen.getByTestId("annotation-panel");
      expect(panel).toHaveAttribute("data-read-only", "true");
    });

    it("closes the drawer when the close button is clicked", async () => {
      const user = userEvent.setup();
      mockWorkspace.settings.lockedPanes = { 0: true, 1: true, 2: true, 3: true };
      mockWorkspace.isAnyPaneLocked = true;
      mockWorkspace.layers = [layerWithComment];
      renderApp();

      // Dismiss the mobile info dialog first
      await user.click(screen.getByRole("button", { name: "Close" }));

      await user.click(screen.getByTestId("mobileAnnotationToggle"));
      expect(screen.getByTestId("mobileAnnotationDrawer")).toBeInTheDocument();

      await user.click(screen.getByTestId("mobileAnnotationClose"));
      expect(screen.queryByTestId("mobileAnnotationDrawer")).not.toBeInTheDocument();
      // Toggle button should reappear
      expect(screen.getByTestId("mobileAnnotationToggle")).toBeInTheDocument();
    });
  });
});
