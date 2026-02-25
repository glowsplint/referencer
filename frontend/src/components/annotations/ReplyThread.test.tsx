import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReplyThread } from "./ReplyThread";
import type { CommentReply } from "@/types/editor";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "5m ago",
}));

function makeReply(overrides: Partial<CommentReply> = {}): CommentReply {
  return {
    id: "reply-1",
    text: "Hello world",
    userName: "Alice",
    timestamp: Date.now(),
    reactions: [],
    ...overrides,
  };
}

describe("ReplyThread", () => {
  it("returns null when there are no replies", () => {
    const { container } = render(
      <ReplyThread
        replies={[]}
        currentUserName="Alice"
        onRemoveReply={vi.fn()}
        onToggleReplyReaction={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders reply user name and timestamp", () => {
    render(
      <ReplyThread
        replies={[makeReply()]}
        currentUserName="Alice"
        onRemoveReply={vi.fn()}
        onToggleReplyReaction={vi.fn()}
      />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("renders reply text as HTML", () => {
    render(
      <ReplyThread
        replies={[makeReply({ text: "<b>Bold reply</b>" })]}
        currentUserName="Alice"
        onRemoveReply={vi.fn()}
        onToggleReplyReaction={vi.fn()}
      />,
    );
    expect(screen.getByText("Bold reply")).toBeInTheDocument();
  });

  it("shows all replies when 3 or fewer", () => {
    const replies = [
      makeReply({ id: "r1", userName: "Alice" }),
      makeReply({ id: "r2", userName: "Bob" }),
      makeReply({ id: "r3", userName: "Charlie" }),
    ];
    render(
      <ReplyThread
        replies={replies}
        currentUserName="Alice"
        onRemoveReply={vi.fn()}
        onToggleReplyReaction={vi.fn()}
      />,
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("collapses and shows expand button when more than 3 replies", () => {
    const replies = [
      makeReply({ id: "r1", userName: "Alice" }),
      makeReply({ id: "r2", userName: "Bob" }),
      makeReply({ id: "r3", userName: "Charlie" }),
      makeReply({ id: "r4", userName: "David" }),
      makeReply({ id: "r5", userName: "Eve" }),
    ];
    render(
      <ReplyThread
        replies={replies}
        currentUserName="Alice"
        onRemoveReply={vi.fn()}
        onToggleReplyReaction={vi.fn()}
      />,
    );

    // Only last 3 visible
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("David")).toBeInTheDocument();
    expect(screen.getByText("Eve")).toBeInTheDocument();

    // Expand button shows hidden count
    expect(screen.getByText("Show 2 more replies")).toBeInTheDocument();
  });

  it("expands all replies when the expand button is clicked", async () => {
    const user = userEvent.setup();
    const replies = [
      makeReply({ id: "r1", userName: "Alice" }),
      makeReply({ id: "r2", userName: "Bob" }),
      makeReply({ id: "r3", userName: "Charlie" }),
      makeReply({ id: "r4", userName: "David" }),
    ];
    render(
      <ReplyThread
        replies={replies}
        currentUserName="Alice"
        onRemoveReply={vi.fn()}
        onToggleReplyReaction={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Show 1 more reply"));

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("David")).toBeInTheDocument();
  });

  it("calls onRemoveReply when the remove button is clicked", async () => {
    const user = userEvent.setup();
    const onRemoveReply = vi.fn();
    render(
      <ReplyThread
        replies={[makeReply({ id: "reply-42" })]}
        currentUserName="Alice"
        onRemoveReply={onRemoveReply}
        onToggleReplyReaction={vi.fn()}
      />,
    );

    await user.click(screen.getByTitle("Remove reply"));
    expect(onRemoveReply).toHaveBeenCalledWith("reply-42");
  });

  it("renders reaction bars on replies that have reactions", () => {
    const reply = makeReply({
      reactions: [{ emoji: "👍", userName: "Bob" }],
    });
    render(
      <ReplyThread
        replies={[reply]}
        currentUserName="Alice"
        onRemoveReply={vi.fn()}
        onToggleReplyReaction={vi.fn()}
      />,
    );
    expect(screen.getByText("👍")).toBeInTheDocument();
  });
});
