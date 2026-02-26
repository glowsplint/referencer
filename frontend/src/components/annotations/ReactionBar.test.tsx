import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactionBar } from "./ReactionBar";
import type { CommentReaction } from "@/types/editor";

describe("ReactionBar", () => {
  describe("when there are no reactions", () => {
    it("then returns null", () => {
      const { container } = render(
        <ReactionBar reactions={[]} currentUserName="Alice" onToggleReaction={vi.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("when there are multiple reactions", () => {
    it("then renders grouped reaction pills with emoji and count", () => {
      const reactions: CommentReaction[] = [
        { emoji: "👍", userName: "Alice" },
        { emoji: "👍", userName: "Bob" },
        { emoji: "❤️", userName: "Alice" },
      ];
      render(
        <ReactionBar reactions={reactions} currentUserName="Charlie" onToggleReaction={vi.fn()} />,
      );

      // Two groups: thumbs up (2) and heart (1)
      expect(screen.getByText("👍")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("❤️")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("when the current user has reacted", () => {
    it("then highlights the reaction pill", () => {
      const reactions: CommentReaction[] = [{ emoji: "👍", userName: "Alice" }];
      render(
        <ReactionBar reactions={reactions} currentUserName="Alice" onToggleReaction={vi.fn()} />,
      );

      const button = screen.getByTitle("Alice");
      expect(button.className).toContain("border-blue-400");
    });
  });

  describe("when the current user has not reacted", () => {
    it("then does not highlight the reaction pill", () => {
      const reactions: CommentReaction[] = [{ emoji: "👍", userName: "Bob" }];
      render(
        <ReactionBar reactions={reactions} currentUserName="Alice" onToggleReaction={vi.fn()} />,
      );

      const button = screen.getByTitle("Bob");
      expect(button.className).not.toContain("border-blue-400");
    });
  });

  describe("when a reaction pill is clicked", () => {
    it("then calls onToggleReaction with the emoji", async () => {
      const user = userEvent.setup();
      const onToggleReaction = vi.fn();
      const reactions: CommentReaction[] = [{ emoji: "👍", userName: "Alice" }];
      render(
        <ReactionBar
          reactions={reactions}
          currentUserName="Alice"
          onToggleReaction={onToggleReaction}
        />,
      );

      await user.click(screen.getByTitle("Alice"));
      expect(onToggleReaction).toHaveBeenCalledWith("👍");
    });
  });

  describe("when multiple users reacted with the same emoji", () => {
    it("then shows all user names in the title tooltip", () => {
      const reactions: CommentReaction[] = [
        { emoji: "👍", userName: "Alice" },
        { emoji: "👍", userName: "Bob" },
      ];
      render(
        <ReactionBar reactions={reactions} currentUserName="Charlie" onToggleReaction={vi.fn()} />,
      );

      expect(screen.getByTitle("Alice, Bob")).toBeInTheDocument();
    });
  });
});
