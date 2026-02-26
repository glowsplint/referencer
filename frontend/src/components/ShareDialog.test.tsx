import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ShareDialog } from "./ShareDialog";
import { renderWithWorkspace } from "@/test/render-with-workspace";

const mockLogin = vi.fn();
const mockAuth = {
  user: null as { id: string; email: string; name: string; avatarUrl: string } | null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: vi.fn(),
};

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => mockAuth,
}));

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
    mockAuth.isAuthenticated = true;
    mockAuth.user = { id: "1", email: "test@test.com", name: "Test User", avatarUrl: "" };
    mockAuth.login = mockLogin;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("when opened and authenticated", () => {
    it("then shows sharing options", () => {
      renderShareDialog();
      expect(screen.getByText("Share workspace")).toBeInTheDocument();
      expect(screen.getByTestId("shareReadonlyButton")).toBeInTheDocument();
      expect(screen.getByTestId("shareEditButton")).toBeInTheDocument();
    });
  });

  describe("when open is false", () => {
    it("then does not render the dialog", () => {
      renderWithWorkspace(
        <ShareDialog open={false} onOpenChange={vi.fn()} workspaceId="test-workspace-123" />,
      );
      expect(screen.queryByText("Share workspace")).not.toBeInTheDocument();
    });
  });

  describe("when read-only sharing is selected", () => {
    it("then creates a read-only share link and copies it to clipboard", async () => {
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
    it("then creates an edit share link and copies it to clipboard", async () => {
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

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockAuth.isAuthenticated = false;
      mockAuth.user = null;
    });

    it("then shows login prompt instead of share options", () => {
      renderShareDialog();
      expect(screen.getByText("Share workspace")).toBeInTheDocument();
      expect(screen.getByText("Sign in to generate a share link for this workspace.")).toBeInTheDocument();
      expect(screen.getByTestId("shareLoginPrompt")).toBeInTheDocument();
      expect(screen.queryByTestId("shareReadonlyButton")).not.toBeInTheDocument();
      expect(screen.queryByTestId("shareEditButton")).not.toBeInTheDocument();
    });

    it("then clicking Google login calls login with google", () => {
      renderShareDialog();
      fireEvent.click(screen.getByText("Sign in with Google"));
      expect(mockLogin).toHaveBeenCalledWith("google");
    });

    it("then clicking GitHub login calls login with github", () => {
      renderShareDialog();
      fireEvent.click(screen.getByText("Sign in with GitHub"));
      expect(mockLogin).toHaveBeenCalledWith("github");
    });
  });
});
