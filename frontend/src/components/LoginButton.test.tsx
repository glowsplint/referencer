import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginButton } from "./LoginButton";

const mockLogin = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
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

  it("renders the login button", () => {
    render(<LoginButton />);
    expect(screen.getByTestId("loginButton")).toBeInTheDocument();
  });

  it("shows popover with provider buttons when clicked", async () => {
    const user = userEvent.setup();
    render(<LoginButton />);

    await user.click(screen.getByTestId("loginButton"));

    expect(await screen.findByTestId("loginPopover")).toBeInTheDocument();
    expect(screen.getByTestId("login-google")).toHaveTextContent("Sign in with Google");
    expect(screen.getByTestId("login-apple")).toHaveTextContent("Sign in with Apple");
    expect(screen.getByTestId("login-facebook")).toHaveTextContent("Sign in with Facebook");
  });

  it("calls login with correct provider on click", async () => {
    const user = userEvent.setup();
    render(<LoginButton />);

    await user.click(screen.getByTestId("loginButton"));
    await user.click(screen.getByTestId("login-google"));

    expect(mockLogin).toHaveBeenCalledWith("google");
  });
});
