import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu";

const mockLogout = vi.fn();
const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: "",
};

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: mockLogout,
  }),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it("renders user avatar with initial", () => {
    render(<UserMenu />);
    const button = screen.getByTestId("userMenuButton");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("T");
  });

  it("shows dropdown with name, email, and sign out on click", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByTestId("userMenuButton"));

    expect(await screen.findByTestId("userMenuDropdown")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("signOutButton")).toHaveTextContent("Sign out");
  });

  it("calls logout when sign out is clicked", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByTestId("userMenuButton"));
    await user.click(screen.getByTestId("signOutButton"));

    expect(mockLogout).toHaveBeenCalled();
  });
});
