import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HubPage } from "./HubPage";

vi.mock("@/lib/ksuid", () => ({
  randomKSUID: () => "mock-ksuid-123",
}));

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "2h ago",
}));

// Mock the hooks used by HubPage
const mockLogin = vi.fn();
const mockCreate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
  }),
}));

vi.mock("@/hooks/data/use-workspaces", () => ({
  useWorkspaces: () => ({
    workspaces: [],
    isLoading: false,
    create: mockCreate,
    rename: vi.fn(),
    remove: vi.fn(),
    duplicate: vi.fn(),
    toggleFavorite: vi.fn(),
    moveToFolder: vi.fn(),
    unfileWorkspace: vi.fn(),
  }),
}));

vi.mock("@/hooks/data/use-folders", () => ({
  useFolders: () => ({
    folders: [],
    create: vi.fn(),
    rename: vi.fn(),
    remove: vi.fn(),
    toggleFavorite: vi.fn(),
    moveFolder: vi.fn(),
  }),
}));

describe("HubPage", () => {
  describe("when user is not authenticated", () => {
    it("renders the guest hero with app name and description", () => {
      render(<HubPage navigate={vi.fn()} />);
      // "Referencer" appears in header and hero — both present
      expect(screen.getAllByText("Referencer")).toHaveLength(2);
      expect(screen.getByText(/Annotate, highlight, and connect/)).toBeInTheDocument();
    });

    it("renders the 'Try without signing in' button", () => {
      render(<HubPage navigate={vi.fn()} />);
      expect(screen.getByTestId("tryWithoutSignIn")).toBeInTheDocument();
    });

    it("navigates to a new workspace when 'Try without signing in' is clicked", async () => {
      const user = userEvent.setup();
      const navigate = vi.fn();
      render(<HubPage navigate={navigate} />);

      await user.click(screen.getByTestId("tryWithoutSignIn"));
      expect(navigate).toHaveBeenCalledWith("#/mock-ksuid-123");
    });

    it("calls login with 'google' when Sign in is clicked", async () => {
      const user = userEvent.setup();
      render(<HubPage navigate={vi.fn()} />);

      await user.click(screen.getByTestId("heroSignIn"));
      expect(mockLogin).toHaveBeenCalledWith("google");
    });
  });
});
