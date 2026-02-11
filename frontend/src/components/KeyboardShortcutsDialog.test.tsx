import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

function renderDialog(open = true, onOpenChange = () => {}) {
  return render(
    <KeyboardShortcutsDialog open={open} onOpenChange={onOpenChange} />
  );
}

describe("KeyboardShortcutsDialog", () => {
  it("renders when open", () => {
    renderDialog();
    expect(screen.getByTestId("keyboardShortcutsDialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderDialog(false);
    expect(screen.queryByTestId("keyboardShortcutsDialog")).not.toBeInTheDocument();
  });

  it("displays section headers", () => {
    renderDialog();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Text Formatting")).toBeInTheDocument();
    expect(screen.getByText("Headings")).toBeInTheDocument();
    expect(screen.getByText("Lists & Blocks")).toBeInTheDocument();
    expect(screen.getByText("Text Alignment")).toBeInTheDocument();
    expect(screen.getByText("General")).toBeInTheDocument();
  });

  it("displays workspace shortcuts", () => {
    renderDialog();
    expect(screen.getByText("Cycle to next layer")).toBeInTheDocument();
    expect(screen.getByText("Selection tool")).toBeInTheDocument();
    expect(screen.getByText("Arrow tool")).toBeInTheDocument();
    expect(screen.getByText("Comments tool")).toBeInTheDocument();
    expect(screen.getByText("Navigate between words")).toBeInTheDocument();
    expect(screen.getByText("Toggle dark mode")).toBeInTheDocument();
    expect(screen.getByText("Toggle editor layout")).toBeInTheDocument();
    expect(screen.getByText("Toggle editor lock")).toBeInTheDocument();
    expect(screen.getByText("Toggle management pane")).toBeInTheDocument();
  });

  it("displays text formatting shortcuts", () => {
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

  it("displays heading shortcuts", () => {
    renderDialog();
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByText(`Heading ${i}`)).toBeInTheDocument();
    }
  });

  it("displays list and block shortcuts", () => {
    renderDialog();
    expect(screen.getByText("Bullet list")).toBeInTheDocument();
    expect(screen.getByText("Ordered list")).toBeInTheDocument();
    expect(screen.getByText("Task list")).toBeInTheDocument();
    expect(screen.getByText("Blockquote")).toBeInTheDocument();
    expect(screen.getByText("Code block")).toBeInTheDocument();
  });

  it("displays text alignment shortcuts", () => {
    renderDialog();
    expect(screen.getByText("Align left")).toBeInTheDocument();
    expect(screen.getByText("Align center")).toBeInTheDocument();
    expect(screen.getByText("Align right")).toBeInTheDocument();
    expect(screen.getByText("Align justify")).toBeInTheDocument();
  });

  it("displays undo/redo shortcuts", () => {
    renderDialog();
    expect(screen.getByText("Undo (workspace when locked)")).toBeInTheDocument();
    expect(screen.getByText("Redo (workspace when locked)")).toBeInTheDocument();
  });

  it("has a close button in the footer", () => {
    renderDialog();
    expect(screen.getByTestId("shortcutsCloseButton")).toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", () => {
    const onOpenChange = vi.fn();
    renderDialog(true, onOpenChange);
    fireEvent.click(screen.getByTestId("shortcutsCloseButton"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
