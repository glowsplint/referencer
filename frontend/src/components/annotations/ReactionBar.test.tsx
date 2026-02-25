import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReactionBar } from "./ReactionBar";
import type { CommentReaction } from "@/types/editor";

function renderReactionBar(
  reactions: CommentReaction[] = [],
  overrides: Partial<{ currentUserName: string; onToggleReaction: () => void }> = {},
) {
  const props = {
    reactions,
    currentUserName: "Alice",
    onToggleReaction: vi.fn(),
    ...overrides,
  };
  render(<ReactionBar {...props} />);
  return props;
}

describe("ReactionBar", () => {
  describe("when there are no reactions", () => {
    it("renders nothing", () => {
      const { container } = render(
        <ReactionBar reactions={[]} currentUserName="Alice" onToggleReaction={vi.fn()} />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when there are reactions", () => {
    it("renders grouped reaction pills with emoji and count", () => {
      renderReactionBar([
        { emoji: "\u{1F44D}", userName: "Alice" },
        { emoji: "\u{1F44D}", userName: "Bob" },
        { emoji: "\u2764\uFE0F", userName: "Charlie" },
      ]);
      // Thumbs up with count 2
      expect(screen.getByTitle("Alice, Bob")).toBeInTheDocument();
      expect(screen.getByTitle("Alice, Bob")).toHaveTextContent("2");
      // Heart with count 1
      expect(screen.getByTitle("Charlie")).toBeInTheDocument();
      expect(screen.getByTitle("Charlie")).toHaveTextContent("1");
    });

    it("highlights the current user's reactions", () => {
      renderReactionBar([
        { emoji: "\u{1F44D}", userName: "Alice" },
        { emoji: "\u2764\uFE0F", userName: "Bob" },
      ]);
      // Alice's thumbs up should have the highlighted style
      const thumbsUp = screen.getByTitle("Alice");
      expect(thumbsUp.className).toContain("border-blue-400");

      // Bob's heart should not have the highlighted style for Alice
      const heart = screen.getByTitle("Bob");
      expect(heart.className).not.toContain("border-blue-400");
    });
  });

  describe("when a reaction pill is clicked", () => {
    it("calls onToggleReaction with the emoji", () => {
      const props = renderReactionBar([{ emoji: "\u{1F44D}", userName: "Alice" }]);
      fireEvent.click(screen.getByTitle("Alice"));
      expect(props.onToggleReaction).toHaveBeenCalledWith("\u{1F44D}");
    });
  });
});
