import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteDialog } from "./DeleteDialog";

function renderDialog(overrides: Partial<Parameters<typeof DeleteDialog>[0]> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    workspaceTitle: "My Workspace",
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<DeleteDialog {...props} />);
  return props;
}

describe("DeleteDialog", () => {
  describe("when open", () => {
    it("shows the dialog with the workspace title", () => {
      renderDialog();
      expect(screen.getByText("Delete Workspace")).toBeInTheDocument();
      expect(screen.getByText(/My Workspace/)).toBeInTheDocument();
    });

    it("shows cancel and delete buttons", () => {
      renderDialog();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
    });
  });

  describe("when the delete button is clicked", () => {
    it("calls onDelete", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("confirmDelete"));
      expect(props.onDelete).toHaveBeenCalledOnce();
    });
  });

  describe("when the cancel button is clicked", () => {
    it("calls onOpenChange with false", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("when closed", () => {
    it("does not render the dialog content", () => {
      renderDialog({ open: false });
      expect(screen.queryByText("Delete Workspace")).not.toBeInTheDocument();
    });
  });
});
