import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithDocument } from "@/test/render-with-document";
import { TableDropdownMenu } from "./table-dropdown-menu";

// Track hook return value so tests can override it
let mockUseTableReturn = {
  isVisible: true,
  isInTable: false,
  insertTable: vi.fn(),
  addRowBefore: vi.fn(),
  addRowAfter: vi.fn(),
  deleteRow: vi.fn(),
  addColumnBefore: vi.fn(),
  addColumnAfter: vi.fn(),
  deleteColumn: vi.fn(),
  mergeCells: vi.fn(),
  splitCell: vi.fn(),
  toggleHeaderRow: vi.fn(),
  toggleHeaderColumn: vi.fn(),
  deleteTable: vi.fn(),
};

vi.mock("./use-table-dropdown-menu", () => ({
  useTableDropdownMenu: () => mockUseTableReturn,
}));

vi.mock("@/hooks/ui/use-tiptap-editor", () => ({
  useTiptapEditor: () => ({ editor: null }),
}));

// Mock dropdown primitives to avoid Radix portal/pointer issues in jsdom
vi.mock("@/components/tiptap-ui-primitive/dropdown-menu", () => {
  let onOpenChangeFn: ((open: boolean) => void) | null = null;

  return {
    DropdownMenu: ({
      children,
      open,
      onOpenChange,
    }: {
      children: React.ReactNode;
      open?: boolean;
      onOpenChange?: (open: boolean) => void;
    }) => {
      onOpenChangeFn = onOpenChange ?? null;
      return (
        <div data-testid="dropdown-menu" data-open={open}>
          {children}
        </div>
      );
    },
    DropdownMenuTrigger: ({
      children,
      asChild: _asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => (
      <div data-testid="dropdown-trigger" onClick={() => onOpenChangeFn?.(true)}>
        {children}
      </div>
    ),
    DropdownMenuContent: ({
      children,
    }: {
      children: React.ReactNode;
      align?: string;
      portal?: boolean;
    }) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({
      children,
      asChild: _asChild,
    }: {
      children: React.ReactNode;
      asChild?: boolean;
    }) => <div data-testid="dropdown-item">{children}</div>,
  };
});

vi.mock("@/components/tiptap-ui-primitive/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    "aria-label": ariaLabel,
    "data-active-state": activeState,
    ...props
  }: Record<string, unknown>) => (
    <button
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={disabled as boolean}
      aria-label={ariaLabel as string}
      data-active-state={activeState as string}
      {...props}
    >
      {children as React.ReactNode}
    </button>
  ),
  ButtonGroup: ({ children }: { children?: React.ReactNode; orientation?: string }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/components/tiptap-ui-primitive/card", () => ({
  Card: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  CardBody: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

// Mock all table icons
vi.mock("@/components/tiptap-icons/table-icon", () => ({
  TableIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/chevron-down-icon", () => ({
  ChevronDownIcon: ({ className }: { className?: string }) => (
    <span data-testid="chevron-down-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-add-column-icon", () => ({
  TableAddColumnIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-add-column-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-add-row-icon", () => ({
  TableAddRowIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-add-row-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-delete-column-icon", () => ({
  TableDeleteColumnIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-delete-column-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-delete-row-icon", () => ({
  TableDeleteRowIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-delete-row-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-delete-icon", () => ({
  TableDeleteIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-delete-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-merge-cells-icon", () => ({
  TableMergeCellsIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-merge-cells-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-split-cell-icon", () => ({
  TableSplitCellIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-split-cell-icon" className={className} />
  ),
}));

vi.mock("@/components/tiptap-icons/table-header-icon", () => ({
  TableHeaderIcon: ({ className }: { className?: string }) => (
    <span data-testid="table-header-icon" className={className} />
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUseTableReturn = {
    isVisible: true,
    isInTable: false,
    insertTable: vi.fn(),
    addRowBefore: vi.fn(),
    addRowAfter: vi.fn(),
    deleteRow: vi.fn(),
    addColumnBefore: vi.fn(),
    addColumnAfter: vi.fn(),
    deleteColumn: vi.fn(),
    mergeCells: vi.fn(),
    splitCell: vi.fn(),
    toggleHeaderRow: vi.fn(),
    toggleHeaderColumn: vi.fn(),
    deleteTable: vi.fn(),
  };
});

describe("TableDropdownMenu", () => {
  it("renders the trigger button with table label", () => {
    renderWithDocument(<TableDropdownMenu />);
    expect(screen.getByRole("button", { name: "Table" })).toBeInTheDocument();
  });

  it("when not visible, renders nothing", () => {
    mockUseTableReturn.isVisible = false;
    const { container } = renderWithDocument(<TableDropdownMenu />);
    expect(container.querySelector("[data-testid='dropdown-menu']")).not.toBeInTheDocument();
  });

  it("when not in table, clicking the button inserts a table directly", async () => {
    const user = userEvent.setup();
    renderWithDocument(<TableDropdownMenu />);

    await user.click(screen.getByRole("button", { name: "Table" }));

    expect(mockUseTableReturn.insertTable).toHaveBeenCalled();
  });

  it("when not in table, does not render a dropdown", () => {
    renderWithDocument(<TableDropdownMenu />);
    expect(screen.queryByTestId("dropdown-menu")).not.toBeInTheDocument();
  });

  it("when in table, clicking the trigger opens the dropdown", async () => {
    mockUseTableReturn.isInTable = true;
    const user = userEvent.setup();
    renderWithDocument(<TableDropdownMenu />);

    await user.click(screen.getByRole("button", { name: "Table" }));

    expect(screen.getByTestId("dropdown-menu")).toHaveAttribute("data-open", "true");
  });

  it("when not in table, does not show table manipulation actions", () => {
    mockUseTableReturn.isInTable = false;
    renderWithDocument(<TableDropdownMenu />);

    expect(screen.queryByText("Add row before")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete table")).not.toBeInTheDocument();
    expect(screen.queryByText("Merge cells")).not.toBeInTheDocument();
  });

  it("when in a table, shows all table manipulation actions", () => {
    mockUseTableReturn.isInTable = true;
    renderWithDocument(<TableDropdownMenu />);

    expect(screen.getByText("Add row before")).toBeInTheDocument();
    expect(screen.getByText("Add row after")).toBeInTheDocument();
    expect(screen.getByText("Delete row")).toBeInTheDocument();
    expect(screen.getByText("Add column before")).toBeInTheDocument();
    expect(screen.getByText("Add column after")).toBeInTheDocument();
    expect(screen.getByText("Delete column")).toBeInTheDocument();
    expect(screen.getByText("Merge cells")).toBeInTheDocument();
    expect(screen.getByText("Split cell")).toBeInTheDocument();
    expect(screen.getByText("Toggle header row")).toBeInTheDocument();
    expect(screen.getByText("Toggle header column")).toBeInTheDocument();
    expect(screen.getByText("Delete table")).toBeInTheDocument();
  });

  it("trigger button has active state 'on' when in a table", () => {
    mockUseTableReturn.isInTable = true;
    renderWithDocument(<TableDropdownMenu />);

    expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute(
      "data-active-state",
      "on",
    );
  });

  it("trigger button has active state 'off' when not in a table", () => {
    mockUseTableReturn.isInTable = false;
    renderWithDocument(<TableDropdownMenu />);

    expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute(
      "data-active-state",
      "off",
    );
  });

  it("clicking a table manipulation action calls the correct handler", async () => {
    mockUseTableReturn.isInTable = true;
    const user = userEvent.setup();
    renderWithDocument(<TableDropdownMenu />);

    await user.click(screen.getByText("Add row before"));
    expect(mockUseTableReturn.addRowBefore).toHaveBeenCalled();
  });

  it("clicking 'Delete table' calls deleteTable", async () => {
    mockUseTableReturn.isInTable = true;
    const user = userEvent.setup();
    renderWithDocument(<TableDropdownMenu />);

    await user.click(screen.getByText("Delete table"));
    expect(mockUseTableReturn.deleteTable).toHaveBeenCalled();
  });
});
