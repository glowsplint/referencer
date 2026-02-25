import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickEmojiPicker } from "./QuickEmojiPicker";
import { QUICK_EMOJIS } from "@/constants/emojis";

function renderPicker(overrides: Partial<Parameters<typeof QuickEmojiPicker>[0]> = {}) {
  const props = {
    onSelect: vi.fn(),
    onOpenFull: vi.fn(),
    ...overrides,
  };
  render(<QuickEmojiPicker {...props} />);
  return props;
}

describe("QuickEmojiPicker", () => {
  describe("when rendered", () => {
    it("shows all quick emoji buttons", () => {
      renderPicker();
      for (const emoji of QUICK_EMOJIS) {
        expect(screen.getByText(emoji)).toBeInTheDocument();
      }
    });

    it("shows the + button for opening the full picker", () => {
      renderPicker();
      expect(screen.getByTitle("More emojis")).toBeInTheDocument();
    });
  });

  describe("when an emoji button is clicked", () => {
    it("calls onSelect with the emoji", () => {
      const props = renderPicker();
      fireEvent.click(screen.getByText(QUICK_EMOJIS[0]));
      expect(props.onSelect).toHaveBeenCalledWith(QUICK_EMOJIS[0]);
    });
  });

  describe("when the + button is clicked", () => {
    it("calls onOpenFull", () => {
      const props = renderPicker();
      fireEvent.click(screen.getByTitle("More emojis"));
      expect(props.onOpenFull).toHaveBeenCalledOnce();
    });
  });
});
