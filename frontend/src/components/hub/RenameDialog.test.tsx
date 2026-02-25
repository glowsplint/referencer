import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RenameDialog } from "./RenameDialog";

describe("RenameDialog", () => {
  it("renders the dialog with the current title in the input", () => {
    render(
      <RenameDialog
        open={true}
        onOpenChange={vi.fn()}
        currentTitle="Old Name"
        onRename={vi.fn()}
      />,
    );
    expect(screen.getByText("Rename Workspace")).toBeInTheDocument();
    expect(screen.getByTestId("renameInput")).toHaveValue("Old Name");
  });

  it("calls onRename with the trimmed input value on submit", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(
      <RenameDialog
        open={true}
        onOpenChange={vi.fn()}
        currentTitle="Old Name"
        onRename={onRename}
      />,
    );

    const input = screen.getByTestId("renameInput");
    await user.clear(input);
    await user.type(input, "  New Name  ");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onRename).toHaveBeenCalledWith("New Name");
  });

  it("disables the Save button when input is empty or whitespace", async () => {
    const user = userEvent.setup();
    render(
      <RenameDialog
        open={true}
        onOpenChange={vi.fn()}
        currentTitle="Old Name"
        onRename={vi.fn()}
      />,
    );

    const input = screen.getByTestId("renameInput");
    await user.clear(input);

    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
  });

  it("calls onOpenChange(false) when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <RenameDialog
        open={true}
        onOpenChange={onOpenChange}
        currentTitle="Old Name"
        onRename={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render when closed", () => {
    render(
      <RenameDialog
        open={false}
        onOpenChange={vi.fn()}
        currentTitle="Old Name"
        onRename={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("renameDialog")).not.toBeInTheDocument();
  });
});
