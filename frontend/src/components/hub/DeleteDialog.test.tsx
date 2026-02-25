import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDialog } from "./DeleteDialog";

describe("DeleteDialog", () => {
  describe("when opened", () => {
    it("then renders the workspace title in the confirmation message", () => {
    render(
      <DeleteDialog
        open={true}
        onOpenChange={vi.fn()}
        workspaceTitle="My Workspace"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/My Workspace/)).toBeInTheDocument();
    expect(screen.getByText("Delete Workspace")).toBeInTheDocument();
    });
  });

  describe("when the Delete button is clicked", () => {
    it("then calls onDelete", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <DeleteDialog
        open={true}
        onOpenChange={vi.fn()}
        workspaceTitle="My Workspace"
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByTestId("confirmDelete"));
    expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe("when Cancel is clicked", () => {
    it("then calls onOpenChange with false", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <DeleteDialog
        open={true}
        onOpenChange={onOpenChange}
        workspaceTitle="My Workspace"
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
      <DeleteDialog
        open={false}
        onOpenChange={vi.fn()}
        workspaceTitle="My Workspace"
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("deleteDialog")).not.toBeInTheDocument();
    });
  });
});
