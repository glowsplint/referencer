import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReplyThread } from "./ReplyThread";
import type { CommentReply } from "@/types/editor";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "5m ago",
}));

function makeReply(overrides: Partial<CommentReply> = {}): CommentReply {
  return {
    id: "reply-1",
    text: "This is a reply",
    userName: "Alice",
    timestamp: Date.now(),
    reactions: [],
    ...overrides,
  };
}

function renderThread(
  replies: CommentReply[] = [],
  overrides: Partial<{
    currentUserName: string;
    onRemoveReply: () => void;
    onToggleReplyReaction: () => void;
  }> = {},
) {
  const props = {
    replies,
    currentUserName: "Alice",
    onRemoveReply: vi.fn(),
    onToggleReplyReaction: vi.fn(),
    ...overrides,
  };
  render(<ReplyThread {...props} />);
  return props;
}

describe("ReplyThread", () => {
  describe("when there are no replies", () => {
    it("renders nothing", () => {
      const { container } = render(
        <ReplyThread
          replies={[]}
          currentUserName="Alice"
          onRemoveReply={vi.fn()}
          onToggleReplyReaction={vi.fn()}
        />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when there are replies", () => {
    it("shows the reply text and user name", () => {
      renderThread([makeReply({ userName: "Bob", text: "Hello there" })]);
      expect(screen.getByText("Bob")).toBeInTheDocument();
      // text is rendered via dangerouslySetInnerHTML
      expect(screen.getByText("Hello there")).toBeInTheDocument();
    });

    it("shows the relative time", () => {
      renderThread([makeReply()]);
      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });
  });

  describe("when there are more than 3 replies", () => {
    it("collapses older replies and shows a 'Show more' button", () => {
      const replies = [
        makeReply({ id: "r1", text: "First", userName: "A" }),
        makeReply({ id: "r2", text: "Second", userName: "B" }),
        makeReply({ id: "r3", text: "Third", userName: "C" }),
        makeReply({ id: "r4", text: "Fourth", userName: "D" }),
        makeReply({ id: "r5", text: "Fifth", userName: "E" }),
      ];
      renderThread(replies);

      // Should show "Show 2 more replies"
      expect(screen.getByText(/Show 2 more replies/)).toBeInTheDocument();
      // Only last 3 should be visible
      expect(screen.queryByText("First")).not.toBeInTheDocument();
      expect(screen.queryByText("Second")).not.toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
      expect(screen.getByText("Fourth")).toBeInTheDocument();
      expect(screen.getByText("Fifth")).toBeInTheDocument();
    });

    it("expands to show all replies when 'Show more' is clicked", () => {
      const replies = [
        makeReply({ id: "r1", text: "First", userName: "A" }),
        makeReply({ id: "r2", text: "Second", userName: "B" }),
        makeReply({ id: "r3", text: "Third", userName: "C" }),
        makeReply({ id: "r4", text: "Fourth", userName: "D" }),
      ];
      renderThread(replies);

      fireEvent.click(screen.getByText(/Show 1 more reply/));

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
      expect(screen.getByText("Fourth")).toBeInTheDocument();
    });
  });

  describe("when the remove button is clicked on a reply", () => {
    it("calls onRemoveReply with the reply ID", () => {
      const props = renderThread([makeReply({ id: "reply-42" })]);
      fireEvent.click(screen.getByTitle("Remove reply"));
      expect(props.onRemoveReply).toHaveBeenCalledWith("reply-42");
    });
  });

  describe("when a reply has reactions", () => {
    it("renders the reaction bar", () => {
      renderThread([
        makeReply({
          reactions: [{ emoji: "\u{1F44D}", userName: "Bob" }],
        }),
      ]);
      expect(screen.getByTitle("Bob")).toBeInTheDocument();
    });
  });
});
