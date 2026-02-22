import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SimpleEditorToolbar } from "./SimpleEditorToolbar";
import { EditorPane } from "./EditorPane";

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
});

describe("SimpleEditorToolbar lock/unlock", () => {
  it("toolbar is rendered when unlocked", () => {
    render(<SimpleEditorToolbar isLocked={false} />);
    expect(screen.getByTestId("editorToolbar")).toBeInTheDocument();
  });

  it("toolbar is removed from DOM when locked", () => {
    render(<SimpleEditorToolbar isLocked={true} />);
    expect(screen.queryByTestId("editorToolbar")).not.toBeInTheDocument();
  });
});

describe("EditorPane lock/unlock", () => {
  it("calls editor.setEditable(true) when unlocked", () => {
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

  it("calls editor.setEditable(false) when locked", () => {
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

  it("calls editor.emit('selectionUpdate') when unlocked", () => {
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

  it("does NOT call editor.emit('selectionUpdate') when locked", () => {
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

  it("adds editor-locked class when locked", () => {
    const { container } = render(
      <EditorPane
        isLocked={true}
        index={0}
        onEditorMount={vi.fn()}
        onFocus={vi.fn()}
        {...defaultEditorPaneProps}
      />,
    );
    const wrapper = container.querySelector(".simple-editor-wrapper");
    expect(wrapper?.classList.contains("editor-locked")).toBe(true);
  });

  it("does not add editor-locked class when unlocked", () => {
    const { container } = render(
      <EditorPane
        isLocked={false}
        index={0}
        onEditorMount={vi.fn()}
        onFocus={vi.fn()}
        {...defaultEditorPaneProps}
      />,
    );
    const wrapper = container.querySelector(".simple-editor-wrapper");
    expect(wrapper?.classList.contains("editor-locked")).toBe(false);
  });

  it("adds arrow-mode class when locked with arrow tool active", () => {
    const { container } = render(
      <EditorPane
        isLocked={true}
        activeTool="arrow"
        index={0}
        onEditorMount={vi.fn()}
        onFocus={vi.fn()}
        {...defaultEditorPaneProps}
      />,
    );
    const wrapper = container.querySelector(".simple-editor-wrapper");
    expect(wrapper?.classList.contains("arrow-mode")).toBe(true);
  });

  it("does not add arrow-mode class when locked with selection tool", () => {
    const { container } = render(
      <EditorPane
        isLocked={true}
        activeTool="selection"
        index={0}
        onEditorMount={vi.fn()}
        onFocus={vi.fn()}
        {...defaultEditorPaneProps}
      />,
    );
    const wrapper = container.querySelector(".simple-editor-wrapper");
    expect(wrapper?.classList.contains("arrow-mode")).toBe(false);
  });

  it("does not add arrow-mode class when unlocked with arrow tool", () => {
    const { container } = render(
      <EditorPane
        isLocked={false}
        activeTool="arrow"
        index={0}
        onEditorMount={vi.fn()}
        onFocus={vi.fn()}
        {...defaultEditorPaneProps}
      />,
    );
    const wrapper = container.querySelector(".simple-editor-wrapper");
    expect(wrapper?.classList.contains("arrow-mode")).toBe(false);
  });

  it("calls onEditorMount with index and editor on mount", () => {
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

  it("calls onFocus with index on focus capture", () => {
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
