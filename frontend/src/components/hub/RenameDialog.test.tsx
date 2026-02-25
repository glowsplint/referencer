import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RenameDialog } from "./RenameDialog";

function renderDialog(overrides: Partial<Parameters<typeof RenameDialog>[0]> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    currentTitle: "Old Title",
    onRename: vi.fn(),
    ...overrides,
  };
  render(<RenameDialog {...props} />);
  return props;
}

describe("RenameDialog", () => {
  describe("when open", () => {
    it("shows the rename dialog with the current title in the input", () => {
      renderDialog();
      expect(screen.getByText("Rename Workspace")).toBeInTheDocument();
      expect(screen.getByTestId("renameInput")).toHaveValue("Old Title");
    });

    it("shows cancel and save buttons", () => {
      renderDialog();
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    });
  });

  describe("when the user types a new title and submits", () => {
    it("calls onRename with the trimmed title", () => {
      const props = renderDialog();
      const input = screen.getByTestId("renameInput");
      fireEvent.change(input, { target: { value: "  New Title  " } });
      fireEvent.submit(input.closest("form")!);
      expect(props.onRename).toHaveBeenCalledWith("New Title");
    });
  });

  describe("when the input is empty", () => {
    it("disables the save button", () => {
      renderDialog();
      const input = screen.getByTestId("renameInput");
      fireEvent.change(input, { target: { value: "   " } });
      expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
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
      expect(screen.queryByText("Rename Workspace")).not.toBeInTheDocument();
    });
  });
});
