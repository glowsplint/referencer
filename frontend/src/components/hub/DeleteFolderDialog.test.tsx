import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeleteFolderDialog } from "./DeleteFolderDialog";

function renderDialog(overrides: Partial<Parameters<typeof DeleteFolderDialog>[0]> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    folderName: "My Folder",
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<DeleteFolderDialog {...props} />);
  return props;
}

describe("DeleteFolderDialog", () => {
  describe("when open", () => {
    it("shows the dialog with the folder name", () => {
      renderDialog();
      expect(screen.getByText("Delete Folder")).toBeInTheDocument();
      expect(screen.getByText(/My Folder/)).toBeInTheDocument();
    });

    it("warns about subfolder deletion", () => {
      renderDialog();
      expect(screen.getByText(/All subfolders will also be deleted/)).toBeInTheDocument();
    });
  });

  describe("when the delete button is clicked", () => {
    it("calls onDelete", () => {
      const props = renderDialog();
      fireEvent.click(screen.getByTestId("confirmDeleteFolder"));
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
      expect(screen.queryByText("Delete Folder")).not.toBeInTheDocument();
    });
  });
});
