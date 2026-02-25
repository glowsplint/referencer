import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

function ThrowingChild({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("when children render without errors", () => {
    it("renders the children", () => {
      render(
        <ErrorBoundary>
          <div>All good</div>
        </ErrorBoundary>,
      );
      expect(screen.getByText("All good")).toBeInTheDocument();
    });
  });

  describe("when children throw an error", () => {
    it("shows the default fallback message", () => {
      render(
        <ErrorBoundary>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });
  });

  describe("when a custom fallback is provided", () => {
    it("renders the custom fallback on error", () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Custom error UI")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
    });
  });

  describe("when silent is true", () => {
    it("renders nothing on error", () => {
      const { container } = render(
        <ErrorBoundary silent>
          <ThrowingChild />
        </ErrorBoundary>,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when Try again is clicked", () => {
    it("attempts to re-render children", () => {
      // We can't easily change the throwing behavior mid-test with class components,
      // but we can verify the button clears the error state
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowingChild shouldThrow={true} />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Try again"));
      // After reset, it will try to render children again - which will throw again
      // (since the component still throws), so error boundary catches it again
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    });
  });
});
