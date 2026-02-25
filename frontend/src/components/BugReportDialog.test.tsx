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

  it("renders dialog with title and form fields when open", () => {
    renderDialog();
    expect(screen.getByText("Report a Bug")).toBeInTheDocument();
    expect(screen.getByTestId("bugReportTitle")).toBeInTheDocument();
    expect(screen.getByTestId("bugReportDescription")).toBeInTheDocument();
    expect(screen.getByTestId("bugReportSubmit")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    renderDialog({ open: false });
    expect(screen.queryByText("Report a Bug")).not.toBeInTheDocument();
  });

  it("submit button is disabled when title is empty", () => {
    renderDialog();
    expect(screen.getByTestId("bugReportSubmit")).toBeDisabled();
  });

  it("submit button is enabled when title has content", () => {
    renderDialog();
    fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
    expect(screen.getByTestId("bugReportSubmit")).not.toBeDisabled();
  });

  it("submit button is disabled when title is only whitespace", () => {
    renderDialog();
    fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "   " } });
    expect(screen.getByTestId("bugReportSubmit")).toBeDisabled();
  });

  it("calls fetch with correct payload on submit", async () => {
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

  it("closes dialog on successful submission", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    const onOpenChange = vi.fn();

    renderDialog({ onOpenChange });
    fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
    fireEvent.click(screen.getByTestId("bugReportSubmit"));

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("does not close dialog on failed submission", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const onOpenChange = vi.fn();

    renderDialog({ onOpenChange });
    fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
    fireEvent.click(screen.getByTestId("bugReportSubmit"));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });

    // Wait for the async handler to complete
    await waitFor(() => {
      expect(screen.getByTestId("bugReportSubmit")).not.toBeDisabled();
    });

    // onOpenChange should not have been called with false (only may be called by Dialog internally)
    const closeCalls = onOpenChange.mock.calls.filter(
      (call: [boolean]) => call[0] === false,
    );
    expect(closeCalls).toHaveLength(0);
  });

  it("handles rate limiting (429 status)", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    const onOpenChange = vi.fn();

    renderDialog({ onOpenChange });
    fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
    fireEvent.click(screen.getByTestId("bugReportSubmit"));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });

  it("handles network error gracefully", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    renderDialog();
    fireEvent.change(screen.getByTestId("bugReportTitle"), { target: { value: "A bug" } });
    fireEvent.click(screen.getByTestId("bugReportSubmit"));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
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
