import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

function renderDialog(open = true, onOpenChange = () => {}) {
  return render(<KeyboardShortcutsDialog open={open} onOpenChange={onOpenChange} />);
}

describe("KeyboardShortcutsDialog", () => {
  describe("when opened", () => {
    it("then shows the keyboard shortcuts dialog", () => {
      renderDialog();
      expect(screen.getByTestId("keyboardShortcutsDialog")).toBeInTheDocument();
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });

    it("then displays all section headers", () => {
      renderDialog();
      expect(screen.getByText("Workspace")).toBeInTheDocument();
      expect(screen.getByText("Text Formatting")).toBeInTheDocument();
      expect(screen.getByText("Headings")).toBeInTheDocument();
      expect(screen.getByText("Lists & Blocks")).toBeInTheDocument();
      expect(screen.getByText("Text Alignment")).toBeInTheDocument();
      expect(screen.getByText("General")).toBeInTheDocument();
    });

    it("then shows a close button", () => {
      renderDialog();
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });
  });

  describe("when closed", () => {
    it("then renders nothing", () => {
      renderDialog(false);
      expect(screen.queryByTestId("keyboardShortcutsDialog")).not.toBeInTheDocument();
    });
  });

  describe("when viewing workspace shortcuts section", () => {
    it("then lists all workspace shortcuts", () => {
      renderDialog();
      expect(screen.getByText("Cycle to next layer")).toBeInTheDocument();
      expect(screen.getByText("Cycle to previous layer")).toBeInTheDocument();
      expect(screen.getByText("Selection tool")).toBeInTheDocument();
      expect(screen.getByText("Arrow tool")).toBeInTheDocument();
      expect(screen.getByText("Comments tool")).toBeInTheDocument();
      expect(screen.getByText("Navigate between words")).toBeInTheDocument();
      expect(screen.getByText("Toggle dark mode")).toBeInTheDocument();
      expect(screen.getByText("Toggle editor layout")).toBeInTheDocument();
      expect(screen.getByText("Toggle editor lock")).toBeInTheDocument();
      expect(screen.getByText("Toggle management pane")).toBeInTheDocument();
      expect(screen.getByText("Eraser tool")).toBeInTheDocument();
    });
  });

  describe("when viewing text formatting shortcuts section", () => {
    it("then lists all text formatting shortcuts", () => {
      renderDialog();
      expect(screen.getByText("Bold")).toBeInTheDocument();
      expect(screen.getByText("Italic")).toBeInTheDocument();
      expect(screen.getByText("Underline")).toBeInTheDocument();
      expect(screen.getByText("Strikethrough")).toBeInTheDocument();
      expect(screen.getByText("Inline code")).toBeInTheDocument();
      expect(screen.getByText("Superscript")).toBeInTheDocument();
      expect(screen.getByText("Subscript")).toBeInTheDocument();
      expect(screen.getByText("Color highlight")).toBeInTheDocument();
    });
  });

  describe("when viewing headings shortcuts section", () => {
    it("then lists heading levels 1 through 6", () => {
      renderDialog();
      for (let i = 1; i <= 6; i++) {
        expect(screen.getByText(`Heading ${i}`)).toBeInTheDocument();
      }
    });

    it("then uses literal Ctrl for heading shortcuts regardless of platform", () => {
      renderDialog();
      const heading1Row = screen.getByText("Heading 1").closest("div");
      const kbdElements = heading1Row!.querySelectorAll("kbd");
      const kbdTexts = Array.from(kbdElements).map((el) => el.textContent);
      expect(kbdTexts).toContain("Ctrl");
    });
  });

  describe("when viewing lists and blocks shortcuts section", () => {
    it("then lists all list and block shortcuts", () => {
      renderDialog();
      expect(screen.getByText("Bullet list")).toBeInTheDocument();
      expect(screen.getByText("Ordered list")).toBeInTheDocument();
      expect(screen.getByText("Task list")).toBeInTheDocument();
      expect(screen.getByText("Blockquote")).toBeInTheDocument();
      expect(screen.getByText("Code block")).toBeInTheDocument();
    });
  });

  describe("when viewing text alignment shortcuts section", () => {
    it("then lists all alignment shortcuts", () => {
      renderDialog();
      expect(screen.getByText("Align left")).toBeInTheDocument();
      expect(screen.getByText("Align center")).toBeInTheDocument();
      expect(screen.getByText("Align right")).toBeInTheDocument();
      expect(screen.getByText("Align justify")).toBeInTheDocument();
    });
  });

  describe("when viewing general shortcuts section", () => {
    it("then lists undo and redo shortcuts", () => {
      renderDialog();
      expect(screen.getByText("Undo (workspace when locked)")).toBeInTheDocument();
      expect(screen.getByText("Redo (workspace when locked)")).toBeInTheDocument();
    });
  });

  describe("when displaying modifier keys", () => {
    it("then uses OS-appropriate modifier key label for formatting shortcuts", () => {
      renderDialog();
      const isMac = navigator.platform?.includes("Mac");
      const expected = isMac ? "\u2318" : "Ctrl";

      const boldRow = screen.getByText("Bold").closest("div");
      const kbdElements = boldRow!.querySelectorAll("kbd");
      const kbdTexts = Array.from(kbdElements).map((el) => el.textContent);
      expect(kbdTexts).toContain(expected);
    });
  });

  describe("when close button is clicked", () => {
    it("then calls onOpenChange with false", () => {
      const onOpenChange = vi.fn();
      renderDialog(true, onOpenChange);
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
