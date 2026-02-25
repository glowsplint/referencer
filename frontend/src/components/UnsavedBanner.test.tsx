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
  describe("when user is not authenticated and not loading", () => {
    it("then renders the banner with sign-in message", () => {
      mockAuth.isAuthenticated = false;
      mockAuth.isLoading = false;

      render(<UnsavedBanner />);
      expect(screen.getByTestId("unsavedBanner")).toBeInTheDocument();
      expect(screen.getByText("Sign in to save your work")).toBeInTheDocument();
    });
  });

  describe("when user is authenticated", () => {
    it("then does not render the banner", () => {
      mockAuth.isAuthenticated = true;
      mockAuth.isLoading = false;

      render(<UnsavedBanner />);
      expect(screen.queryByTestId("unsavedBanner")).not.toBeInTheDocument();
    });
  });

  describe("when auth is loading", () => {
    it("then does not render the banner", () => {
      mockAuth.isAuthenticated = false;
      mockAuth.isLoading = true;

      render(<UnsavedBanner />);
      expect(screen.queryByTestId("unsavedBanner")).not.toBeInTheDocument();
    });
  });
});
