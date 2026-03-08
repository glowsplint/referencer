import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MentionSuggestionList } from "./MentionSuggestionList";

describe("MentionSuggestionList", () => {
  it("renders nothing when items is empty", () => {
    const { container } = render(<MentionSuggestionList items={[]} command={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders items with @ prefix", () => {
    render(
      <MentionSuggestionList
        items={[
          { id: "1", label: "Alice" },
          { id: "2", label: "Bob" },
        ]}
        command={vi.fn()}
      />,
    );
    expect(screen.getByText("@Alice")).toBeTruthy();
    expect(screen.getByText("@Bob")).toBeTruthy();
  });

  it("calls command when item is clicked", async () => {
    const command = vi.fn();
    render(<MentionSuggestionList items={[{ id: "1", label: "Alice" }]} command={command} />);
    screen.getByText("@Alice").click();
    expect(command).toHaveBeenCalledWith({ id: "1", label: "Alice" });
  });
});
