import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewDocumentDialog } from "./NewDocumentDialog";

describe("NewDocumentDialog", () => {
  describe("when opened", () => {
    it("then shows the dialog with the title 'New Document'", () => {
      render(<NewDocumentDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.getByText("New Document")).toBeInTheDocument();
      expect(screen.getByText("Enter a name for your document.")).toBeInTheDocument();
    });

    it("then has an empty input field", () => {
      render(<NewDocumentDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.getByTestId("newDocumentNameInput")).toHaveValue("");
    });
  });

  describe("when the input is empty or whitespace", () => {
    it("then disables the Create button", () => {
      render(<NewDocumentDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.getByTestId("newDocumentCreateButton")).toBeDisabled();
    });

    it("then disables the Create button for whitespace-only input", async () => {
      const user = userEvent.setup();
      render(<NewDocumentDialog open={true} onOpenChange={vi.fn()} onCreate={vi.fn()} />);

      await user.type(screen.getByTestId("newDocumentNameInput"), "   ");
      expect(screen.getByTestId("newDocumentCreateButton")).toBeDisabled();
    });
  });

  describe("when a name is submitted", () => {
    it("then calls onCreate with the trimmed title", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      render(<NewDocumentDialog open={true} onOpenChange={vi.fn()} onCreate={onCreate} />);

      await user.type(screen.getByTestId("newDocumentNameInput"), "  My Study  ");
      await user.click(screen.getByTestId("newDocumentCreateButton"));

      expect(onCreate).toHaveBeenCalledWith("My Study");
    });

    it("then submits on Enter key", async () => {
      const user = userEvent.setup();
      const onCreate = vi.fn();
      render(<NewDocumentDialog open={true} onOpenChange={vi.fn()} onCreate={onCreate} />);

      await user.type(screen.getByTestId("newDocumentNameInput"), "Enter Test{Enter}");

      expect(onCreate).toHaveBeenCalledWith("Enter Test");
    });
  });

  describe("when Cancel is clicked", () => {
    it("then calls onOpenChange with false", async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(<NewDocumentDialog open={true} onOpenChange={onOpenChange} onCreate={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("when closed", () => {
    it("then does not render the dialog", () => {
      render(<NewDocumentDialog open={false} onOpenChange={vi.fn()} onCreate={vi.fn()} />);
      expect(screen.queryByTestId("newDocumentDialog")).not.toBeInTheDocument();
    });
  });
});
