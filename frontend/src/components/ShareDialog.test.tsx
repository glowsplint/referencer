import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ShareDialog } from "./ShareDialog";
import { renderWithWorkspace } from "@/test/render-with-workspace";

function renderShareDialog(overrides = {}) {
  return renderWithWorkspace(
    <ShareDialog open={true} onOpenChange={vi.fn()} workspaceId="test-workspace-123" />,
    overrides,
  );
}

describe("ShareDialog", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("when opened", () => {
    it("shows sharing options", () => {
      renderShareDialog();
      expect(screen.getByText("Share workspace")).toBeInTheDocument();
      expect(screen.getByTestId("shareReadonlyButton")).toBeInTheDocument();
      expect(screen.getByTestId("shareEditButton")).toBeInTheDocument();
    });
  });

  describe("when open is false", () => {
    it("does not render the dialog", () => {
      renderWithWorkspace(
        <ShareDialog open={false} onOpenChange={vi.fn()} workspaceId="test-workspace-123" />,
      );
      expect(screen.queryByText("Share workspace")).not.toBeInTheDocument();
    });
  });

  describe("when read-only sharing is selected", () => {
    it("creates a read-only share link and copies it to clipboard", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: "ABC123", url: "/s/ABC123" }),
      });

      renderShareDialog();
      fireEvent.click(screen.getByTestId("shareReadonlyButton"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/share",
          expect.objectContaining({
            method: "POST",
          }),
        );
      });

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/s/ABC123"));
      });
    });
  });

  describe("when edit sharing is selected", () => {
    it("creates an edit share link and copies it to clipboard", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: "XYZ789", url: "/s/XYZ789" }),
      });

      renderShareDialog();
      fireEvent.click(screen.getByTestId("shareEditButton"));

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          "/api/share",
          expect.objectContaining({
            method: "POST",
          }),
        );
      });

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/s/XYZ789"));
      });
    });
  });
});
