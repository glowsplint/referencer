import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextRemovalButton, TextRemovalDialog } from "./text-removal-dialog";

// Track hook return values so tests can override them
let mockRemoval = {
  selectedMarks: [] as string[],
  toggleMark: vi.fn(),
  pattern: "*",
  setPattern: vi.fn(),
  isRegex: false,
  toggleRegex: vi.fn(),
  patternError: null as string | null,
  matches: [] as { from: number; to: number }[],
  matchCount: 0,
  isOpen: false,
  openDialog: vi.fn(),
  closeDialog: vi.fn(),
  isMinimized: false,
  toggleMinimize: vi.fn(),
  showConfirmation: false,
  requestRemoval: vi.fn(),
  confirmRemoval: vi.fn(),
  cancelRemoval: vi.fn(),
};

vi.mock("./use-text-removal", () => ({
  useTextRemoval: () => mockRemoval,
}));

let mockEditorEditable = true;

vi.mock("@/hooks/ui/use-tiptap-editor", () => ({
  useTiptapEditor: () => ({ editor: { isEditable: mockEditorEditable } }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.count !== undefined) return `${key}:${opts.count}`;
      return key;
    },
  }),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => (open ? <div data-testid="dialog-wrapper">{children}</div> : null),
  DialogContent: ({ children, ...props }: Record<string, unknown>) => (
    <div {...props}>{children as React.ReactNode}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: Record<string, unknown>) => (
    <button
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled as boolean}
      {...props}
    >
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock("@/components/tiptap-ui-primitive/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
    ...props
  }: Record<string, unknown>) => (
    <button
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled as boolean}
      aria-label={ariaLabel as string}
      {...props}
    >
      {children as React.ReactNode}
    </button>
  ),
}));

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockEditorEditable = true;
  mockRemoval = {
    selectedMarks: [],
    toggleMark: vi.fn(),
    pattern: "*",
    setPattern: vi.fn(),
    isRegex: false,
    toggleRegex: vi.fn(),
    patternError: null,
    matches: [],
    matchCount: 0,
    isOpen: false,
    openDialog: vi.fn(),
    closeDialog: vi.fn(),
    isMinimized: false,
    toggleMinimize: vi.fn(),
    showConfirmation: false,
    requestRemoval: vi.fn(),
    confirmRemoval: vi.fn(),
    cancelRemoval: vi.fn(),
  };
});

describe("TextRemovalButton", () => {
  it("renders button with correct aria-label", () => {
    render(<TextRemovalButton />);
    expect(screen.getByRole("button", { name: "textRemoval.label" })).toBeInTheDocument();
  });

  it("calls openDialog when clicked", () => {
    render(<TextRemovalButton />);
    fireEvent.click(screen.getByRole("button", { name: "textRemoval.label" }));
    expect(mockRemoval.openDialog).toHaveBeenCalled();
  });

  it("is disabled when editor is not editable", () => {
    mockEditorEditable = false;
    render(<TextRemovalButton />);
    expect(screen.getByRole("button", { name: "textRemoval.label" })).toBeDisabled();
  });
});

describe("TextRemovalDialog", () => {
  const mockEditor = { isEditable: true } as never;

  beforeEach(() => {
    mockRemoval.isOpen = true;
  });

  it("renders dialog when isOpen is true", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByTestId("textRemovalDialog")).toBeInTheDocument();
  });

  it("does not render dialog when isOpen is false", () => {
    mockRemoval.isOpen = false;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.queryByTestId("textRemovalDialog")).not.toBeInTheDocument();
  });

  it("renders mark toggle buttons", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    const markNames = [
      "bold",
      "italic",
      "underline",
      "strike",
      "code",
      "superscript",
      "subscript",
      "link",
    ];
    for (const mark of markNames) {
      expect(screen.getByTestId(`markToggle-${mark}`)).toBeInTheDocument();
    }
  });

  it("calls toggleMark when a mark button is clicked", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    fireEvent.click(screen.getByTestId("markToggle-bold"));
    expect(mockRemoval.toggleMark).toHaveBeenCalledWith("bold");
  });

  it("shows active state on selected marks", () => {
    mockRemoval.selectedMarks = ["bold", "italic"];
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    const boldBtn = screen.getByTestId("markToggle-bold");
    expect(boldBtn.className).toContain("bg-primary");
    const codeBtn = screen.getByTestId("markToggle-code");
    expect(codeBtn.className).toContain("bg-background");
  });

  it("shows pattern input with default value", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    const input = screen.getByTestId("patternInput");
    expect(input).toHaveValue("*");
  });

  it("calls setPattern when input changes", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    fireEvent.change(screen.getByTestId("patternInput"), {
      target: { value: "hello" },
    });
    expect(mockRemoval.setPattern).toHaveBeenCalledWith("hello");
  });

  it("shows glob/regex toggle", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByTestId("regexToggle")).toBeInTheDocument();
  });

  it("calls toggleRegex when toggle is clicked", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    fireEvent.click(screen.getByTestId("regexToggle"));
    expect(mockRemoval.toggleRegex).toHaveBeenCalled();
  });

  it("shows match count", () => {
    mockRemoval.matchCount = 5;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByTestId("matchCount")).toHaveTextContent("textRemoval.matchCount:5");
  });

  it("shows no matches message when count is 0", () => {
    mockRemoval.matchCount = 0;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByTestId("matchCount")).toHaveTextContent("textRemoval.noMatches");
  });

  it("disables Remove button when no matches", () => {
    mockRemoval.matchCount = 0;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByTestId("removeButton")).toBeDisabled();
  });

  it("calls requestRemoval when Remove is clicked", () => {
    mockRemoval.matchCount = 3;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    fireEvent.click(screen.getByTestId("removeButton"));
    expect(mockRemoval.requestRemoval).toHaveBeenCalled();
  });

  it("shows confirmation when showConfirmation is true", () => {
    mockRemoval.showConfirmation = true;
    mockRemoval.matchCount = 3;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByTestId("confirmRemove")).toBeInTheDocument();
    expect(screen.queryByTestId("removeButton")).not.toBeInTheDocument();
  });

  it("calls confirmRemoval on confirm", () => {
    mockRemoval.showConfirmation = true;
    mockRemoval.matchCount = 3;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    fireEvent.click(screen.getByTestId("confirmRemove"));
    expect(mockRemoval.confirmRemoval).toHaveBeenCalled();
  });

  it("calls cancelRemoval on cancel in confirmation", () => {
    mockRemoval.showConfirmation = true;
    mockRemoval.matchCount = 3;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    // The cancel button text is "textRemoval.cancel"
    const cancelButtons = screen.getAllByText("textRemoval.cancel");
    fireEvent.click(cancelButtons[0]);
    expect(mockRemoval.cancelRemoval).toHaveBeenCalled();
  });

  it("shows floating pill when minimized", () => {
    mockRemoval.isMinimized = true;
    mockRemoval.isOpen = true;
    mockRemoval.matchCount = 2;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByTestId("textRemovalPill")).toBeInTheDocument();
    // Dialog should not be visible when minimized
    expect(screen.queryByTestId("textRemovalDialog")).not.toBeInTheDocument();
  });

  it("calls toggleMinimize from pill restore button", () => {
    mockRemoval.isMinimized = true;
    mockRemoval.isOpen = true;
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    fireEvent.click(screen.getByText("textRemoval.restore"));
    expect(mockRemoval.toggleMinimize).toHaveBeenCalled();
  });

  it("calls closeDialog when Cancel is clicked", () => {
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    const cancelButtons = screen.getAllByText("textRemoval.cancel");
    fireEvent.click(cancelButtons[0]);
    expect(mockRemoval.closeDialog).toHaveBeenCalled();
  });

  it("shows pattern error when patternError is set", () => {
    mockRemoval.patternError = "Invalid pattern";
    render(<TextRemovalDialog editor={mockEditor} removal={mockRemoval} />);
    expect(screen.getByText("textRemoval.invalidPattern")).toBeInTheDocument();
  });
});
