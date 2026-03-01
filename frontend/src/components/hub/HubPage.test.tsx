import { describe, it, expect, vi, beforeEach } from "vitest";
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

const mockAuth = {
  user: null as { id: string; name: string; email: string; avatarUrl: string } | null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
};

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => mockAuth,
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
    beforeEach(() => {
      mockAuth.user = null;
      mockAuth.isAuthenticated = false;
      mockAuth.isLoading = false;
    });

    it("then renders the guest hero with app name and description", () => {
      render(<HubPage navigate={vi.fn()} />);
      // "Referencer" appears in header and hero — both present
      expect(screen.getAllByText("Referencer")).toHaveLength(2);
      expect(screen.getByText(/Annotate, highlight, and connect/)).toBeInTheDocument();
    });

    it("then renders the 'Try without signing in' button", () => {
      render(<HubPage navigate={vi.fn()} />);
      expect(screen.getByTestId("tryWithoutSignIn")).toBeInTheDocument();
    });

    it("then navigates to a new workspace when 'Try without signing in' is clicked", async () => {
      const user = userEvent.setup();
      const navigate = vi.fn();
      render(<HubPage navigate={navigate} />);

      await user.click(screen.getByTestId("tryWithoutSignIn"));
      expect(navigate).toHaveBeenCalledWith("#/mock-ksuid-123");
    });

    it("then calls login with 'google' when Sign in is clicked", async () => {
      const user = userEvent.setup();
      render(<HubPage navigate={vi.fn()} />);

      await user.click(screen.getByTestId("heroSignIn"));
      expect(mockLogin).toHaveBeenCalledWith("google");
    });
  });

  describe("when user is authenticated", () => {
    beforeEach(() => {
      mockAuth.user = {
        id: "user-1",
        name: "Test User",
        email: "test@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
      };
      mockAuth.isAuthenticated = true;
      mockAuth.isLoading = false;
      mockCreate.mockClear();
    });

    it("then renders the workspace grid instead of the hero", () => {
      render(<HubPage navigate={vi.fn()} />);
      expect(screen.queryByTestId("tryWithoutSignIn")).not.toBeInTheDocument();
      expect(screen.queryByTestId("heroSignIn")).not.toBeInTheDocument();
    });

    it("then opens the new workspace dialog when 'New Workspace' is clicked", async () => {
      const user = userEvent.setup();
      render(<HubPage navigate={vi.fn()} />);

      await user.click(screen.getByTestId("newWorkspaceButton"));
      expect(screen.getByTestId("newWorkspaceDialog")).toBeInTheDocument();
      expect(screen.getByTestId("newWorkspaceNameInput")).toBeInTheDocument();
    });

    it("then creates workspace with name and navigates on dialog submit", async () => {
      const user = userEvent.setup();
      const navigate = vi.fn();
      render(<HubPage navigate={navigate} />);

      // Open the dialog
      await user.click(screen.getByTestId("newWorkspaceButton"));

      // Type a workspace name and submit
      await user.type(screen.getByTestId("newWorkspaceNameInput"), "My Bible Study");
      await user.click(screen.getByTestId("newWorkspaceCreateButton"));

      expect(mockCreate).toHaveBeenCalledWith("mock-ksuid-123", "My Bible Study");
      expect(navigate).toHaveBeenCalledWith("#/mock-ksuid-123");
    });

    it("then closes the dialog after creating a workspace", async () => {
      const user = userEvent.setup();
      render(<HubPage navigate={vi.fn()} />);

      // Open the dialog
      await user.click(screen.getByTestId("newWorkspaceButton"));
      expect(screen.getByTestId("newWorkspaceDialog")).toBeInTheDocument();

      // Type a name and submit
      await user.type(screen.getByTestId("newWorkspaceNameInput"), "Test");
      await user.click(screen.getByTestId("newWorkspaceCreateButton"));

      // Dialog should close
      expect(screen.queryByTestId("newWorkspaceDialog")).not.toBeInTheDocument();
    });
  });
});
