import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginButton } from "./LoginButton";

const mockLogin = vi.fn();

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

describe("LoginButton", () => {
  beforeEach(() => {
    mockLogin.mockClear();
  });

  describe("when rendered", () => {
    it("shows the login button", () => {
      render(<LoginButton />);
      expect(screen.getByTestId("loginButton")).toBeInTheDocument();
    });
  });

  describe("when the login button is clicked", () => {
    it("shows the provider popover with Google and GitHub options", async () => {
      const user = userEvent.setup();
      render(<LoginButton />);

      await user.click(screen.getByTestId("loginButton"));

      expect(await screen.findByTestId("loginPopover")).toBeInTheDocument();
      expect(screen.getByTestId("login-google")).toHaveTextContent("Sign in with Google");
      expect(screen.getByTestId("login-github")).toHaveTextContent("Sign in with GitHub");
    });
  });

  describe("when Google provider is clicked", () => {
    it("initiates Google login", async () => {
      const user = userEvent.setup();
      render(<LoginButton />);

      await user.click(screen.getByTestId("loginButton"));
      await user.click(screen.getByTestId("login-google"));

      expect(mockLogin).toHaveBeenCalledWith("google");
    });
  });

  describe("when GitHub provider is clicked", () => {
    it("initiates GitHub login", async () => {
      const user = userEvent.setup();
      render(<LoginButton />);

      await user.click(screen.getByTestId("loginButton"));
      await user.click(screen.getByTestId("login-github"));

      expect(mockLogin).toHaveBeenCalledWith("github");
    });
  });
});
