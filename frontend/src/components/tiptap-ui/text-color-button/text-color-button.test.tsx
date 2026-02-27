import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextColorButton, TextColorPopoverContent, TextColorPopover } from "./text-color-button";
import type { Editor } from "@tiptap/react";

// Track hook return values so tests can override them
let mockUseTextColorReturn = {
  isVisible: true,
  isActive: false,
  canSetTextColor: true,
  currentColor: "",
  setTextColor: vi.fn(),
  unsetTextColor: vi.fn(),
};

vi.mock("./use-text-color", () => ({
  useTextColor: () => mockUseTextColorReturn,
  pickTextColorsByValue: (values: string[]) =>
    values.map((v) => ({ label: `Color ${v}`, value: v })),
}));

vi.mock("@/hooks/ui/use-tiptap-editor", () => ({
  useTiptapEditor: (editor?: Editor | null) => ({ editor: editor ?? null }),
}));

vi.mock("@/hooks/ui/use-menu-navigation", () => ({
  useMenuNavigation: () => ({ selectedIndex: -1 }),
}));

vi.mock("@/hooks/ui/use-is-breakpoint", () => ({
  useIsBreakpoint: () => false,
}));

vi.mock("@/components/tiptap-icons/ban-icon", () => ({
  BanIcon: ({ className }: { className?: string }) => (
    <span data-testid="ban-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-ui-primitive/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    role,
    "aria-label": ariaLabel,
    "aria-pressed": ariaPressed,
    "data-active-state": activeState,
    ...props
  }: Record<string, unknown>) => (
    <button
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled as boolean}
      role={role as string | undefined}
      aria-label={ariaLabel as string}
      aria-pressed={ariaPressed as boolean}
      data-active-state={activeState as string}
      {...props}
    >
      {children as React.ReactNode}
    </button>
  ),
  ButtonGroup: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/tiptap-ui-primitive/popover", () => ({
  Popover: ({
    children,
    open,
    onOpenChange,
  }: {
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) => <div data-open={open}>{children}</div>,
  PopoverTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="popover-trigger">{children}</div>,
  PopoverContent: ({
    children,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    "aria-label"?: string;
  }) => (
    <div data-testid="popover-content" aria-label={ariaLabel}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/tiptap-ui-primitive/separator", () => ({
  Separator: () => <hr />,
}));

vi.mock("@/components/tiptap-ui-primitive/card", () => ({
  Card: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="card" {...props}>
      {children}
    </div>
  ),
  CardBody: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardItemGroup: ({
    children,
  }: {
    children?: React.ReactNode;
  }) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseTextColorReturn = {
    isVisible: true,
    isActive: false,
    canSetTextColor: true,
    currentColor: "",
    setTextColor: vi.fn(),
    unsetTextColor: vi.fn(),
  };
});

describe("TextColorButton", () => {
  it("renders with the correct aria-label for a given color", () => {
    render(<TextColorButton color="#dc2626" label="Red" />);
    expect(screen.getByRole("button", { name: "Red" })).toBeInTheDocument();
  });

  it("when no label is provided, then falls back to color-based aria-label", () => {
    render(<TextColorButton color="#dc2626" />);
    expect(screen.getByRole("button", { name: "Text color: #dc2626" })).toBeInTheDocument();
  });

  it("when clicked, then calls setTextColor with the color value", () => {
    render(<TextColorButton color="#dc2626" label="Red" />);
    fireEvent.click(screen.getByRole("button", { name: "Red" }));
    expect(mockUseTextColorReturn.setTextColor).toHaveBeenCalledWith("#dc2626");
  });

  it("when canSetTextColor is false, then the button is disabled", () => {
    mockUseTextColorReturn.canSetTextColor = false;
    render(<TextColorButton color="#dc2626" label="Red" />);
    expect(screen.getByRole("button", { name: "Red" })).toBeDisabled();
  });

  it("when the color is active, then data-active-state is on", () => {
    mockUseTextColorReturn.isActive = true;
    render(<TextColorButton color="#dc2626" label="Red" />);
    expect(screen.getByRole("button", { name: "Red" })).toHaveAttribute("data-active-state", "on");
  });

  it("when the color is not active, then data-active-state is off", () => {
    render(<TextColorButton color="#dc2626" label="Red" />);
    expect(screen.getByRole("button", { name: "Red" })).toHaveAttribute(
      "data-active-state",
      "off",
    );
  });

  it("when onClick handler prevents default, then setTextColor is not called", () => {
    const onClickPreventDefault = (e: React.MouseEvent) => e.preventDefault();
    render(<TextColorButton color="#dc2626" label="Red" onClick={onClickPreventDefault} />);
    fireEvent.click(screen.getByRole("button", { name: "Red" }));
    expect(mockUseTextColorReturn.setTextColor).not.toHaveBeenCalled();
  });
});

describe("TextColorPopoverContent", () => {
  it("renders color buttons for each provided color", () => {
    const colors = [
      { label: "Red", value: "#dc2626" },
      { label: "Blue", value: "#2563eb" },
    ];
    render(<TextColorPopoverContent colors={colors} />);
    expect(screen.getByRole("button", { name: "Red text color" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Blue text color" })).toBeInTheDocument();
  });

  it("renders a remove-color button", () => {
    render(<TextColorPopoverContent colors={[]} />);
    expect(screen.getByLabelText("Remove text color")).toBeInTheDocument();
  });

  it("when remove-color is clicked, then calls unsetTextColor", () => {
    render(<TextColorPopoverContent colors={[]} />);
    fireEvent.click(screen.getByLabelText("Remove text color"));
    expect(mockUseTextColorReturn.unsetTextColor).toHaveBeenCalled();
  });
});

describe("TextColorPopover", () => {
  it("renders the trigger button with aria-label", () => {
    render(<TextColorPopover />);
    expect(screen.getByRole("button", { name: "Text color" })).toBeInTheDocument();
  });

  it("when not visible, then renders nothing", () => {
    mockUseTextColorReturn.isVisible = false;
    const { container } = render(<TextColorPopover />);
    expect(container.innerHTML).toBe("");
  });

  it("when canSetTextColor is false, then the trigger button is disabled", () => {
    mockUseTextColorReturn.canSetTextColor = false;
    render(<TextColorPopover />);
    expect(screen.getByRole("button", { name: "Text color" })).toBeDisabled();
  });

  it("renders popover content with color buttons", () => {
    render(<TextColorPopover />);
    expect(screen.getByTestId("popover-content")).toBeInTheDocument();
  });

  it("displays the current color indicator on the trigger button", () => {
    mockUseTextColorReturn.currentColor = "#dc2626";
    render(<TextColorPopover />);
    const trigger = screen.getByRole("button", { name: "Text color" });
    const colorIndicator = trigger.querySelector("span > span:first-child");
    expect(colorIndicator).toHaveStyle({ color: "#dc2626" });
  });
});
