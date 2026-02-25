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
  it("renders the collapsed placeholder text", () => {
    render(<ReplyInput onSubmit={vi.fn()} placeholder="Write a reply..." />);
    expect(screen.getByText("Write a reply...")).toBeInTheDocument();
  });

  it("expands to the editor when the placeholder is clicked", async () => {
    const user = userEvent.setup();
    render(<ReplyInput onSubmit={vi.fn()} placeholder="Write a reply..." />);

    await user.click(screen.getByText("Write a reply..."));

    expect(screen.getByTestId("miniCommentEditor")).toBeInTheDocument();
    expect(screen.getByTitle("Send reply")).toBeInTheDocument();
  });

  it("calls onSubmit with the editor value when send is clicked", async () => {
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

  it("does not submit when the editor text is empty (only HTML tags)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReplyInput onSubmit={onSubmit} placeholder="Write a reply..." />);

    // Expand
    await user.click(screen.getByText("Write a reply..."));

    // Click send without typing anything
    await user.click(screen.getByTitle("Send reply"));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("collapses back when blurred with empty content", async () => {
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
