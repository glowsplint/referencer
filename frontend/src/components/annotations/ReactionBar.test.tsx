import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactionBar } from "./ReactionBar";
import type { CommentReaction } from "@/types/editor";

describe("ReactionBar", () => {
  it("returns null when there are no reactions", () => {
    const { container } = render(
      <ReactionBar reactions={[]} currentUserName="Alice" onToggleReaction={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders grouped reaction pills with emoji and count", () => {
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

  it("highlights the reaction pill when the current user has reacted", () => {
    const reactions: CommentReaction[] = [
      { emoji: "👍", userName: "Alice" },
    ];
    render(
      <ReactionBar reactions={reactions} currentUserName="Alice" onToggleReaction={vi.fn()} />,
    );

    const button = screen.getByTitle("Alice");
    expect(button.className).toContain("border-blue-400");
  });

  it("does not highlight when current user has not reacted", () => {
    const reactions: CommentReaction[] = [
      { emoji: "👍", userName: "Bob" },
    ];
    render(
      <ReactionBar reactions={reactions} currentUserName="Alice" onToggleReaction={vi.fn()} />,
    );

    const button = screen.getByTitle("Bob");
    expect(button.className).not.toContain("border-blue-400");
  });

  it("calls onToggleReaction with the emoji when a pill is clicked", async () => {
    const user = userEvent.setup();
    const onToggleReaction = vi.fn();
    const reactions: CommentReaction[] = [
      { emoji: "👍", userName: "Alice" },
    ];
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

  it("shows all user names in the title tooltip", () => {
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
