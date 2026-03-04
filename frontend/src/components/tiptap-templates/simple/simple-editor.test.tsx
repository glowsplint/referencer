import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SimpleEditorToolbar } from "./SimpleEditorToolbar";
import { EditorPane } from "./EditorPane";

// Mock workspace context
const mockToggleFocusedPaneLocked = vi.fn();
const mockIsPaneLocked = vi.fn((_i: number) => false);
let mockWorkspaceOverrides: Record<string, unknown> = {};
vi.mock("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    isPaneLocked: mockIsPaneLocked,
    activeEditorIndex: 0,
    toggleFocusedPaneLocked: mockToggleFocusedPaneLocked,
    readOnly: false,
    ...mockWorkspaceOverrides,
  }),
}));

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "tooltips.switchToEditMode": "Switch to Edit mode",
        "tooltips.switchToAnnotateMode": "Switch to Annotate mode",
      };
      return translations[key] ?? key;
    },
  }),
}));

// Mock editor instance shared across mocks
const mockDispatch = vi.fn();
const mockSetMeta = vi.fn().mockReturnThis();
const mockEditor = {
  isEditable: true,
  isDestroyed: false,
  setEditable: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  state: { tr: { setMeta: mockSetMeta }, doc: {} },
  view: { dispatch: mockDispatch },
};

// Mock @tiptap/react
vi.mock("@tiptap/react", () => ({
  useEditor: () => mockEditor,
  useCurrentEditor: () => ({ editor: mockEditor }),
  EditorContent: (props: Record<string, unknown>) => (
    <div data-testid="editor-content" {...props} />
  ),
  EditorContext: {
    Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  },
}));

// Mock toolbar primitives - pass through style and children
vi.mock("@/components/tiptap-ui-primitive/toolbar", () => ({
  Toolbar: vi.fn(
    ({
      children,
      style,
      ...props
    }: {
      children?: React.ReactNode;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div data-testid="toolbar" style={style} {...props}>
        {children}
      </div>
    ),
  ),
  ToolbarGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  ToolbarSeparator: () => <div />,
}));

vi.mock("@/components/tiptap-ui-primitive/button", () => ({
  Button: () => <button />,
}));

vi.mock("@/components/tiptap-ui-primitive/spacer", () => ({
  Spacer: () => <div />,
}));

vi.mock("@/components/tiptap-ui-primitive/tooltip/tooltip", () => ({
  Tooltip: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children?: React.ReactNode }) => (
    <div role="tooltip">{children}</div>
  ),
}));

// Mock all toolbar child components
vi.mock("@/components/tiptap-ui/heading-dropdown-menu", () => ({
  HeadingDropdownMenu: () => null,
}));
vi.mock("@/components/tiptap-ui/image-upload-button", () => ({
  ImageUploadButton: () => null,
}));
vi.mock("@/components/tiptap-ui/list-dropdown-menu", () => ({
  ListDropdownMenu: () => null,
}));
vi.mock("@/components/tiptap-ui/blockquote-button", () => ({
  BlockquoteButton: () => null,
}));
vi.mock("@/components/tiptap-ui/code-block-button", () => ({
  CodeBlockButton: () => null,
}));
vi.mock("@/components/tiptap-ui/link-popover", () => ({
  LinkPopover: () => null,
  LinkContent: () => null,
  LinkButton: () => null,
}));
vi.mock("@/components/tiptap-ui/mark-button", () => ({
  MarkButton: () => null,
}));
vi.mock("@/components/tiptap-ui/text-align-button", () => ({
  TextAlignButton: () => null,
}));
vi.mock("@/components/tiptap-ui/undo-redo-button", () => ({
  UndoRedoButton: () => null,
}));
vi.mock("@/components/tiptap-ui/clear-formatting-button", () => ({
  ClearFormattingButton: () => null,
}));
vi.mock("@/components/tiptap-ui/text-color-button", () => ({
  TextColorPopover: () => null,
}));
vi.mock("@/components/tiptap-ui/line-height-dropdown", () => ({
  LineHeightDropdown: () => null,
}));
vi.mock("@/components/tiptap-ui/paragraph-spacing-dropdown", () => ({
  ParagraphSpacingDropdown: () => null,
}));
vi.mock("@/components/tiptap-ui/table-dropdown-menu", () => ({
  TableDropdownMenu: () => null,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Lock: (props: Record<string, unknown>) => <svg data-testid="lock-icon" {...props} />,
  LockOpen: (props: Record<string, unknown>) => <svg data-testid="lock-open-icon" {...props} />,
}));

// Mock icons
vi.mock("@/components/tiptap-icons/arrow-left-icon", () => ({
  ArrowLeftIcon: () => null,
}));
vi.mock("@/components/tiptap-icons/link-icon", () => ({
  LinkIcon: () => null,
}));

// Mock hooks
vi.mock("@/hooks/ui/use-is-breakpoint", () => ({
  useIsBreakpoint: () => false,
}));
vi.mock("@/hooks/utilities/use-window-size", () => ({
  useWindowSize: () => ({ width: 1024, height: 768, offsetTop: 0, offsetLeft: 0, scale: 1 }),
}));
vi.mock("@/hooks/ui/use-cursor-visibility", () => ({
  useCursorVisibility: () => ({ x: 0, y: 0, width: 0, height: 0 }),
}));
vi.mock("@/hooks/annotations/use-unified-decorations", () => ({
  useUnifiedDecorations: vi.fn(),
}));
vi.mock("@/hooks/annotations/use-selection-highlight", () => ({
  useSelectionHighlight: vi.fn(),
}));
vi.mock("@/hooks/selection/use-word-hover", () => ({
  useWordHover: vi.fn(),
}));
vi.mock("@/hooks/selection/use-selection-decoration", () => ({
  useSelectionScroll: vi.fn(),
}));
// Mock tiptap extensions
vi.mock("@tiptap/starter-kit", () => ({
  StarterKit: { configure: () => ({}) },
}));
vi.mock("@tiptap/extension-image", () => ({ Image: {} }));
vi.mock("@tiptap/extension-list", () => ({ TaskItem: { configure: () => ({}) }, TaskList: {} }));
vi.mock("@tiptap/extension-text-align", () => ({ TextAlign: { configure: () => ({}) } }));
vi.mock("@tiptap/extension-typography", () => ({ Typography: {} }));
vi.mock("@tiptap/extension-highlight", () => ({ Highlight: { configure: () => ({}) } }));
vi.mock("@tiptap/extension-subscript", () => ({ Subscript: {} }));
vi.mock("@tiptap/extension-superscript", () => ({ Superscript: {} }));
vi.mock("@tiptap/extensions", () => ({ Selection: {} }));
vi.mock("@/lib/tiptap/extensions/layer-highlights", () => ({
  LayerHighlightsExtension: {},
  layerHighlightsPluginKey: {},
}));
vi.mock("@/lib/tiptap/extensions/word-selection", () => ({
  WordSelectionExtension: {},
  wordSelectionPluginKey: {},
}));
vi.mock("@/lib/tiptap/extensions/word-hover", () => ({
  WordHoverExtension: {},
  wordHoverPluginKey: {},
}));
vi.mock("@/components/tiptap-node/image-upload-node/image-upload-node-extension", () => ({
  ImageUploadNode: { configure: () => ({}) },
}));
vi.mock("@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension", () => ({
  HorizontalRule: {},
}));
vi.mock("@/lib/tiptap/upload", () => ({
  handleImageUpload: vi.fn(),
  MAX_FILE_SIZE: 5000000,
}));
vi.mock("@/components/tiptap-templates/simple/data/content.json", () => ({
  default: {},
}));

const defaultEditorPaneProps = {
  layers: [],
  selection: null,
  activeLayerColor: null,
  isDarkMode: false,
  selectedArrowId: null,
  removeArrow: vi.fn(),
  sectionVisibility: [true],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockIsPaneLocked.mockImplementation(() => false);
  mockWorkspaceOverrides = {};
});

describe("SimpleEditorToolbar", () => {
  describe("when unlocked", () => {
    it("then shows the formatting toolbar", () => {
      render(<SimpleEditorToolbar />);
      expect(screen.getByTestId("editorToolbar")).toBeInTheDocument();
    });

    it("then shows the LockOpen icon", () => {
      render(<SimpleEditorToolbar />);
      expect(screen.getByTestId("lock-open-icon")).toBeInTheDocument();
    });
  });

  describe("when locked", () => {
    it("then renders the editing tools wrapper with disabled styling", () => {
      mockIsPaneLocked.mockImplementation(() => true);
      render(<SimpleEditorToolbar />);
      const toolbar = screen.getByTestId("editorToolbar");
      expect(toolbar).toBeInTheDocument();
      // The inner wrapper should have opacity-50, not the toolbar itself
      const wrapper = toolbar.querySelector(".opacity-50");
      expect(wrapper).toBeInTheDocument();
    });

    it("then shows the Lock icon", () => {
      mockIsPaneLocked.mockImplementation(() => true);
      render(<SimpleEditorToolbar />);
      expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });
  });

  describe("lock button", () => {
    it("then renders the lock toggle button", () => {
      render(<SimpleEditorToolbar />);
      expect(screen.getByTestId("toolbarLockButton")).toBeInTheDocument();
    });

    it("when clicked, then calls toggleFocusedPaneLocked", () => {
      render(<SimpleEditorToolbar />);
      fireEvent.click(screen.getByTestId("toolbarLockButton"));
      expect(mockToggleFocusedPaneLocked).toHaveBeenCalledOnce();
    });

    it("when readOnly, then is disabled", () => {
      mockWorkspaceOverrides = { readOnly: true };
      render(<SimpleEditorToolbar />);
      expect(screen.getByTestId("toolbarLockButton")).toBeDisabled();
    });

    it("when locked, then shows Switch to Edit mode tooltip", async () => {
      mockIsPaneLocked.mockImplementation(() => true);
      render(<SimpleEditorToolbar />);
      const btn = screen.getByTestId("toolbarLockButton");

      await act(async () => {
        fireEvent.focus(btn);
      });

      const tooltips = screen.getAllByRole("tooltip");
      const lockTooltip = tooltips.find((t) => t.textContent?.includes("Switch to"));
      expect(lockTooltip).toHaveTextContent("Switch to Edit mode");
      expect(lockTooltip!.querySelector("kbd")).toHaveTextContent("K");
    });

    it("when unlocked, then shows Switch to Annotate mode tooltip", async () => {
      render(<SimpleEditorToolbar />);
      const btn = screen.getByTestId("toolbarLockButton");

      await act(async () => {
        fireEvent.focus(btn);
      });

      const tooltips = screen.getAllByRole("tooltip");
      const lockTooltip = tooltips.find((t) => t.textContent?.includes("Switch to"));
      expect(lockTooltip).toHaveTextContent("Switch to Annotate mode");
      expect(lockTooltip!.querySelector("kbd")).toHaveTextContent("K");
    });

    it("when locked, then the lock button remains interactive", () => {
      mockIsPaneLocked.mockImplementation(() => true);
      render(<SimpleEditorToolbar />);
      const btn = screen.getByTestId("toolbarLockButton");
      expect(btn).not.toBeDisabled();
    });
  });
});

describe("EditorPane", () => {
  describe("when unlocked", () => {
    it("then sets the editor to editable", () => {
      render(
        <EditorPane
          isLocked={false}
          index={0}
          onEditorMount={vi.fn()}
          onFocus={vi.fn()}
          {...defaultEditorPaneProps}
        />,
      );
      expect(mockEditor.setEditable).toHaveBeenCalledWith(true);
    });

    it("then emits selectionUpdate", () => {
      render(
        <EditorPane
          isLocked={false}
          index={0}
          onEditorMount={vi.fn()}
          onFocus={vi.fn()}
          {...defaultEditorPaneProps}
        />,
      );
      expect(mockEditor.emit).toHaveBeenCalledWith("selectionUpdate", {
        editor: mockEditor,
        transaction: mockEditor.state.tr,
      });
    });
  });

  describe("when locked", () => {
    it("then sets the editor to non-editable", () => {
      render(
        <EditorPane
          isLocked={true}
          index={0}
          onEditorMount={vi.fn()}
          onFocus={vi.fn()}
          {...defaultEditorPaneProps}
        />,
      );
      expect(mockEditor.setEditable).toHaveBeenCalledWith(false);
    });

    it("then does not emit selectionUpdate", () => {
      render(
        <EditorPane
          isLocked={true}
          index={0}
          onEditorMount={vi.fn()}
          onFocus={vi.fn()}
          {...defaultEditorPaneProps}
        />,
      );
      expect(mockEditor.emit).not.toHaveBeenCalled();
    });
  });

  describe("when mounted", () => {
    it("then calls onEditorMount with the pane index and editor instance", () => {
      const onEditorMount = vi.fn();
      render(
        <EditorPane
          isLocked={false}
          index={2}
          onEditorMount={onEditorMount}
          onFocus={vi.fn()}
          {...defaultEditorPaneProps}
        />,
      );
      expect(onEditorMount).toHaveBeenCalledWith(2, mockEditor);
    });
  });

  describe("when the editor content receives focus", () => {
    it("then calls onFocus with the pane index", () => {
      const onFocus = vi.fn();
      render(
        <EditorPane
          isLocked={false}
          index={1}
          onEditorMount={vi.fn()}
          onFocus={onFocus}
          {...defaultEditorPaneProps}
        />,
      );
      const editorContent = screen.getByTestId("editor-content");
      fireEvent.focus(editorContent);
      expect(onFocus).toHaveBeenCalledWith(1);
    });
  });
});
