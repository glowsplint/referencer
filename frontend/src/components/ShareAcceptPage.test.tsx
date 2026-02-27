import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShareAcceptPage } from "./ShareAcceptPage";
import { ApiError } from "@/lib/api-client";

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

const mockApiPost = vi.fn();
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-client")>();
  return {
    ...actual,
    apiPost: (...args: unknown[]) => mockApiPost(...args),
  };
});

describe("ShareAcceptPage", () => {
  const mockNavigate = vi.fn();
  const defaultProps = { code: "ABC123", navigate: mockNavigate };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockApiPost.mockReset();
    mockNavigate.mockReset();
    mockAuth.isAuthenticated = false;
    mockAuth.isLoading = false;
    mockAuth.user = null;
    mockAuth.login = mockLogin;
  });

  describe("when auth is loading", () => {
    it("then shows loading state", () => {
      mockAuth.isLoading = true;

      render(<ShareAcceptPage {...defaultProps} />);

      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("when user is not authenticated", () => {
    it("then shows sign-in prompt", () => {
      render(<ShareAcceptPage {...defaultProps} />);

      expect(screen.getByText("Sign in to accept this shared workspace")).toBeInTheDocument();
      expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
      expect(screen.getByText("Sign in with GitHub")).toBeInTheDocument();
    });

    it("then clicking Google login calls login with google", () => {
      render(<ShareAcceptPage {...defaultProps} />);

      fireEvent.click(screen.getByText("Sign in with Google"));
      expect(mockLogin).toHaveBeenCalledWith("google");
    });

    it("then clicking GitHub login calls login with github", () => {
      render(<ShareAcceptPage {...defaultProps} />);

      fireEvent.click(screen.getByText("Sign in with GitHub"));
      expect(mockLogin).toHaveBeenCalledWith("github");
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockAuth.isAuthenticated = true;
      mockAuth.user = { id: "1", email: "test@test.com", name: "Test", avatarUrl: "" };
    });

    it("then shows accepting state", () => {
      mockApiPost.mockReturnValue(new Promise(() => {})); // never resolves

      render(<ShareAcceptPage {...defaultProps} />);

      expect(screen.getByText("Accepting shared workspace...")).toBeInTheDocument();
    });

    it("then calls apiPost with share accept endpoint", async () => {
      mockApiPost.mockResolvedValue({ workspaceId: "ws-123" });

      render(<ShareAcceptPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("/api/share/accept", { code: "ABC123" });
      });
    });

    it("then navigates to workspace on success", async () => {
      mockApiPost.mockResolvedValue({ workspaceId: "ws-123" });

      render(<ShareAcceptPage {...defaultProps} />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("#/ws-123");
      });
    });

    it("then shows expired error on 404", async () => {
      mockApiPost.mockRejectedValue(new ApiError(404));

      render(<ShareAcceptPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("This share link is invalid or has expired.")).toBeInTheDocument();
      });
    });

    it("then shows generic error on other failures", async () => {
      mockApiPost.mockRejectedValue(new Error("network error"));

      render(<ShareAcceptPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
      });
    });

    it("then shows Go to Hub button on error", async () => {
      mockApiPost.mockRejectedValue(new Error("fail"));

      render(<ShareAcceptPage {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Go to Hub")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Go to Hub"));
      expect(mockNavigate).toHaveBeenCalledWith("#/");
    });
  });
});
