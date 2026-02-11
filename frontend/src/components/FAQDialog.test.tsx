import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FAQDialog } from "./FAQDialog";

function renderDialog(open = true, onOpenChange = () => {}) {
  return render(<FAQDialog open={open} onOpenChange={onOpenChange} />);
}

describe("FAQDialog", () => {
  it("renders when open", () => {
    renderDialog();
    expect(screen.getByTestId("faqDialog")).toBeInTheDocument();
    expect(
      screen.getByText("Frequently Asked Questions")
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderDialog(false);
    expect(screen.queryByTestId("faqDialog")).not.toBeInTheDocument();
  });

  it("displays FAQ questions", () => {
    renderDialog();
    expect(screen.getByText("What is this app?")).toBeInTheDocument();
    expect(
      screen.getByText("What is inductive Bible study?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("How does collaboration work?")
    ).toBeInTheDocument();
    expect(screen.getByText("What are layers?")).toBeInTheDocument();
    expect(screen.getByText("How do annotations work?")).toBeInTheDocument();
    expect(screen.getByText("What are arrows for?")).toBeInTheDocument();
    expect(
      screen.getByText("How do I share a workspace?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Can I use this on mobile?")
    ).toBeInTheDocument();
  });

  it("displays FAQ answers", () => {
    renderDialog();
    expect(
      screen.getByText(/collaborative tool for inductive Bible study/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/method of reading Scripture/)
    ).toBeInTheDocument();
  });

  it("has a close button in the footer", () => {
    renderDialog();
    expect(screen.getByTestId("faqCloseButton")).toBeInTheDocument();
  });

  it("calls onOpenChange when close button is clicked", () => {
    const onOpenChange = vi.fn();
    renderDialog(true, onOpenChange);
    fireEvent.click(screen.getByTestId("faqCloseButton"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
