import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteDialog } from "./DeleteDialog";

describe("DeleteDialog", () => {
  it("renders the workspace title in the confirmation message", () => {
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

  it("calls onDelete when the Delete button is clicked", async () => {
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

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
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

  it("does not render content when closed", () => {
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
