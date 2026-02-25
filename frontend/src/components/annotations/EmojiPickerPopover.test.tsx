import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmojiPickerPopover } from "./EmojiPickerPopover";
import { EMOJI_CATEGORIES } from "@/constants/emojis";

function renderPopover(overrides: Partial<Parameters<typeof EmojiPickerPopover>[0]> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    onSelect: vi.fn(),
    children: <button>Trigger</button>,
    ...overrides,
  };
  render(<EmojiPickerPopover {...props} />);
  return props;
}

describe("EmojiPickerPopover", () => {
  describe("when open", () => {
    it("shows emoji category labels", () => {
      renderPopover();
      for (const cat of EMOJI_CATEGORIES) {
        expect(screen.getByText(cat.label)).toBeInTheDocument();
      }
    });

    it("renders emoji buttons", () => {
      renderPopover();
      // Verify at least one emoji from the first category is visible
      const firstEmoji = EMOJI_CATEGORIES[0].emojis[0];
      expect(screen.getByText(firstEmoji)).toBeInTheDocument();
    });
  });

  describe("when an emoji is clicked", () => {
    it("calls onSelect with the emoji and closes the popover", () => {
      const props = renderPopover();
      const firstEmoji = EMOJI_CATEGORIES[0].emojis[0];
      fireEvent.click(screen.getByText(firstEmoji));
      expect(props.onSelect).toHaveBeenCalledWith(firstEmoji);
      expect(props.onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("when closed", () => {
    it("does not show the emoji grid", () => {
      renderPopover({ open: false });
      expect(screen.queryByText(EMOJI_CATEGORIES[0].label)).not.toBeInTheDocument();
    });
  });
});
