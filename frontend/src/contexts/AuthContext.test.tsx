import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("@/lib/auth-client", () => ({
  fetchAuthStatus: vi.fn(),
  loginWith: vi.fn(),
  logout: vi.fn(),
}));

import { fetchAuthStatus } from "@/lib/auth-client";

function AuthConsumer() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div data-testid="loading">Loading</div>;
  if (isAuthenticated && user) {
    return <div data-testid="user">{user.name}</div>;
  }
  return <div data-testid="anonymous">Anonymous</div>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading initially then resolves to authenticated", async () => {
    vi.mocked(fetchAuthStatus).mockResolvedValue({
      authenticated: true,
      user: { id: "1", email: "test@test.com", name: "Test User", avatarUrl: "" },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("loading")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Test User");
    });
  });

  it("shows anonymous when not authenticated", async () => {
    vi.mocked(fetchAuthStatus).mockResolvedValue({
      authenticated: false,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("anonymous")).toBeInTheDocument();
    });
  });

  it("shows anonymous when fetch fails", async () => {
    vi.mocked(fetchAuthStatus).mockRejectedValue(new Error("Network error"));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("anonymous")).toBeInTheDocument();
    });
  });

  it("throws when useAuth is used outside AuthProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow("useAuth must be used within AuthProvider");
    consoleError.mockRestore();
  });
});
