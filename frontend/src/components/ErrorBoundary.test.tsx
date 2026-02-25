import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Content works</div>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress React error boundary console output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("when no error is thrown", () => {
    it("then renders children", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={false} />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Content works")).toBeInTheDocument();
    });
  });

  describe("when an error is thrown", () => {
    it("then renders the default fallback", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });
  });

  describe("when an error is thrown with a custom fallback", () => {
    it("then renders the custom fallback", () => {
      render(
        <ErrorBoundary fallback={<div>Custom error UI</div>}>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      );
      expect(screen.getByText("Custom error UI")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong.")).not.toBeInTheDocument();
    });
  });

  describe("when an error is thrown with silent mode", () => {
    it("then renders nothing", () => {
      const { container } = render(
        <ErrorBoundary silent>
          <ThrowingComponent shouldThrow={true} />
        </ErrorBoundary>,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when Try again is clicked after an error", () => {
    it("then resets the error state and re-renders children", async () => {
      const user = userEvent.setup();
      let shouldThrow = true;

      function ConditionalThrower() {
        if (shouldThrow) throw new Error("Test error");
        return <div>Recovered</div>;
      }

      render(
        <ErrorBoundary>
          <ConditionalThrower />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

      // Fix the error condition then click Try again
      shouldThrow = false;
      await user.click(screen.getByText("Try again"));

      expect(screen.getByText("Recovered")).toBeInTheDocument();
    });
  });
});
