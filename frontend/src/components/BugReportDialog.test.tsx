import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BugReportDialog } from "./BugReportDialog";
import { renderWithWorkspace } from "@/test/render-with-workspace";

function renderDialog(overrides: { open?: boolean; onOpenChange?: ReturnType<typeof vi.fn> } = {}) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  return renderWithWorkspace(
    <BugReportDialog open={overrides.open ?? true} onOpenChange={onOpenChange} />,
  );
}

describe("BugReportDialog", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("when opened", () => {
    it("shows the bug report form", () => {
      renderDialog();
      expect(screen.getByText("Report a Bug")).toBeInTheDocument();
      expect(screen.getByTestId("bugReportTitle")).toBeInTheDocument();
      expect(screen.getByTestId("bugReportDescription")).toBeInTheDocument();
      expect(screen.getByTestId("bugReportSubmit")).toBeInTheDocument();
    });
  });

  describe("when closed", () => {
    it("renders nothing", () => {
      renderDialog({ open: false });
      expect(screen.queryByText("Report a Bug")).not.toBeInTheDocument();
    });
  });

  describe("when title is empty", () => {
    it("disables the submit button", () => {
      renderDialog();
      expect(screen.getByTestId("bugReportSubmit")).toBeDisabled();
    });
  });

  describe("when title is only whitespace", () => {
    it("disables the submit button", () => {
      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "   " } });
      expect(screen.getByTestId("bugReportSubmit")).toBeDisabled();
    });
  });

  describe("when title has content", () => {
    it("enables the submit button", () => {
      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      expect(screen.getByTestId("bugReportSubmit")).not.toBeDisabled();
    });
  });

  describe("when form is submitted", () => {
    it("sends the correct payload to the API", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "Test bug" } });
      fireEvent.change(screen.getByTestId("bugReportDescription"), {
        target: { value: "Steps to reproduce" },
      });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/feedback",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ title: "Test bug", description: "Steps to reproduce" }),
          }),
        );
      });
    });

    it("trims whitespace from title and description before sending", async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      globalThis.fetch = mockFetch;

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "  A bug  " } });
      fireEvent.change(screen.getByTestId("bugReportDescription"), {
        target: { value: "  Some details  " },
      });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/feedback",
          expect.objectContaining({
            body: JSON.stringify({ title: "A bug", description: "Some details" }),
          }),
        );
      });
    });
  });

  describe("when submission succeeds", () => {
    it("closes the dialog", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("when submission fails", () => {
    it("does not close the dialog", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId("bugReportSubmit")).not.toBeDisabled();
      });

      const closeCalls = onOpenChange.mock.calls.filter((call: [boolean]) => call[0] === false);
      expect(closeCalls).toHaveLength(0);
    });
  });

  describe("when rate limited (429)", () => {
    it("handles the rate limit response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });
      const onOpenChange = vi.fn();

      renderDialog({ onOpenChange });
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });
  });

  describe("when a network error occurs", () => {
    it("handles the error gracefully", async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      renderDialog();
      fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
      fireEvent.click(screen.getByTestId("bugReportSubmit"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalled();
      });
    });
  });
});
