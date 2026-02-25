import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReplyInput } from "./ReplyInput";

// Mock MiniCommentEditor to avoid tiptap dependency
vi.mock("@/components/MiniCommentEditor", () => ({
  MiniCommentEditor: ({
    value,
    onChange,
    onBlur,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    onBlur: () => void;
    placeholder: string;
  }) => (
    <input
      data-testid="miniCommentEditor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  ),
}));

describe("ReplyInput", () => {
  describe("when rendered in collapsed state", () => {
    it("then shows the placeholder text", () => {
      render(<ReplyInput onSubmit={vi.fn()} placeholder="Write a reply..." />);
      expect(screen.getByText("Write a reply...")).toBeInTheDocument();
    });
  });

  describe("when the placeholder is clicked", () => {
    it("then expands to the editor", async () => {
      const user = userEvent.setup();
      render(<ReplyInput onSubmit={vi.fn()} placeholder="Write a reply..." />);

      await user.click(screen.getByText("Write a reply..."));

      expect(screen.getByTestId("miniCommentEditor")).toBeInTheDocument();
      expect(screen.getByTitle("Send reply")).toBeInTheDocument();
    });
  });

  describe("when send is clicked with text", () => {
    it("then calls onSubmit with the editor value", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ReplyInput onSubmit={onSubmit} placeholder="Write a reply..." />);

      // Expand
      await user.click(screen.getByText("Write a reply..."));

      // Type in the editor
      const editor = screen.getByTestId("miniCommentEditor");
      await user.type(editor, "My reply text");

      // Click send
      await user.click(screen.getByTitle("Send reply"));

      expect(onSubmit).toHaveBeenCalledWith("My reply text");
    });
  });

  describe("when send is clicked with empty content", () => {
    it("then does not submit", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<ReplyInput onSubmit={onSubmit} placeholder="Write a reply..." />);

      // Expand
      await user.click(screen.getByText("Write a reply..."));

      // Click send without typing anything
      await user.click(screen.getByTitle("Send reply"));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("when blurred with empty content", () => {
    it("then collapses back to placeholder", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ReplyInput onSubmit={vi.fn()} placeholder="Write a reply..." />
          <button>other</button>
        </div>,
      );

      // Expand
      await user.click(screen.getByText("Write a reply..."));
      expect(screen.getByTestId("miniCommentEditor")).toBeInTheDocument();

      // Blur with empty content
      const editor = screen.getByTestId("miniCommentEditor");
      await user.click(editor); // focus it
      await user.click(screen.getByText("other")); // blur

      // Should collapse back to placeholder
      expect(screen.getByText("Write a reply...")).toBeInTheDocument();
    });
  });
});
