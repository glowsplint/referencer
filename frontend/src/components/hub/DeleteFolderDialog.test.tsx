import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteFolderDialog } from "./DeleteFolderDialog";

describe("DeleteFolderDialog", () => {
  describe("when opened", () => {
    it("then renders the folder name in the confirmation message", () => {
      render(
        <DeleteFolderDialog
          open={true}
          onOpenChange={vi.fn()}
          folderName="Study Notes"
          onDelete={vi.fn()}
        />,
      );
      expect(screen.getByText(/Study Notes/)).toBeInTheDocument();
      expect(screen.getByText("Delete Folder")).toBeInTheDocument();
      expect(screen.getByText(/subfolders will also be deleted/)).toBeInTheDocument();
    });
  });

  describe("when the Delete button is clicked", () => {
    it("then calls onDelete", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      render(
        <DeleteFolderDialog
          open={true}
          onOpenChange={vi.fn()}
          folderName="Study Notes"
          onDelete={onDelete}
        />,
      );

      await user.click(screen.getByTestId("confirmDeleteFolder"));
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("when Cancel is clicked", () => {
    it("then calls onOpenChange with false", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <DeleteFolderDialog
          open={true}
          onOpenChange={onOpenChange}
          folderName="Study Notes"
          onDelete={vi.fn()}
        />,
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("when closed", () => {
    it("then does not render content", () => {
      render(
        <DeleteFolderDialog
          open={false}
          onOpenChange={vi.fn()}
          folderName="Study Notes"
          onDelete={vi.fn()}
        />,
      );
      expect(screen.queryByTestId("deleteFolderDialog")).not.toBeInTheDocument();
    });
  });
});
