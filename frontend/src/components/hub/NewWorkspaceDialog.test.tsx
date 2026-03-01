import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewWorkspaceDialog } from "./NewWorkspaceDialog";

describe("NewWorkspaceDialog", () => {
  describe("when opened", () => {
    it("then shows the dialog with the title 'New Workspace'", () => {
      render(<NewWorkspaceDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.getByText("New Workspace")).toBeInTheDocument();
      expect(screen.getByText("Enter a name for your workspace.")).toBeInTheDocument();
    });

    it("then has an empty input field", () => {
      render(<NewWorkspaceDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.getByTestId("newWorkspaceNameInput")).toHaveValue("");
    });
  });

  describe("when the input is empty or whitespace", () => {
    it("then disables the Create button", () => {
      render(<NewWorkspaceDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.getByTestId("newWorkspaceCreateButton")).toBeDisabled();
    });

    it("then disables the Create button for whitespace-only input", async () => {
      const user = userEvent.setup();
      render(<NewWorkspaceDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);

      await user.type(screen.getByTestId("newWorkspaceNameInput"), "   ");
      expect(screen.getByTestId("newWorkspaceCreateButton")).toBeDisabled();
    });
  });

  describe("when a name is submitted", () => {
    it("then calls onCreate with the trimmed title", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      render(<NewWorkspaceDialog open={true} onOpenChange={vi.fn()} onCreate={onCreate} />);

      await user.type(screen.getByTestId("newWorkspaceNameInput"), "  My Study  ");
      await user.click(screen.getByTestId("newWorkspaceCreateButton"));

      expect(onCreate).toHaveBeenCalledWith("My Study");
    });

    it("then submits on Enter key", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      render(<NewWorkspaceDialog open={true} onOpenChange={vi.fn()} onCreate={onCreate} />);

      await user.type(screen.getByTestId("newWorkspaceNameInput"), "Enter Test{Enter}");

      expect(onCreate).toHaveBeenCalledWith("Enter Test");
    });
  });

  describe("when Cancel is clicked", () => {
    it("then calls onOpenChange with false", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<NewWorkspaceDialog open={true} onOpenChange={onOpenChange} onCreate={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("when closed", () => {
    it("then does not render the dialog", () => {
      render(<NewWorkspaceDialog open={false} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.queryByTestId("newWorkspaceDialog")).not.toBeInTheDocument();
    });
  });
});
