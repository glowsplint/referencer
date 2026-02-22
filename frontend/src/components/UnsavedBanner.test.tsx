import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UnsavedBanner } from "./UnsavedBanner";

const mockAuth = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => mockAuth,
}));

describe("UnsavedBanner", () => {
  it("renders banner when user is not authenticated and not loading", () => {
    mockAuth.isAuthenticated = false;
    mockAuth.isLoading = false;

    render(<UnsavedBanner />);
    expect(screen.getByTestId("unsavedBanner")).toBeInTheDocument();
    expect(screen.getByText("Sign in to save your work")).toBeInTheDocument();
  });

  it("does not render when user is authenticated", () => {
    mockAuth.isAuthenticated = true;
    mockAuth.isLoading = false;

    render(<UnsavedBanner />);
    expect(screen.queryByTestId("unsavedBanner")).not.toBeInTheDocument();
  });

  it("does not render while loading", () => {
    mockAuth.isAuthenticated = false;
    mockAuth.isLoading = true;

    render(<UnsavedBanner />);
    expect(screen.queryByTestId("unsavedBanner")).not.toBeInTheDocument();
  });
});
