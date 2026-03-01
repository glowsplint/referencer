import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TitleBar } from "./TitleBar";
import { renderWithWorkspace } from "@/test/render-with-workspace";

const mockWorkspaces = {
  workspaces: [] as any[],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  create: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
  duplicate: vi.fn(),
  toggleFavorite: vi.fn(),
  moveToFolder: vi.fn(),
  unfileWorkspace: vi.fn(),
};

vi.mock("@/hooks/data/use-workspaces", () => ({
  useWorkspaces: () => mockWorkspaces,
}));

const mockAuth = {
  user: null as {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  } | null,
  isAuthenticated: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => mockAuth,
}));

function renderTitleBar(overrides = {}) {
  return renderWithWorkspace(<TitleBar />, overrides);
}

describe("TitleBar", () => {
  beforeEach(() => {
    mockWorkspaces.workspaces = [];
    mockAuth.isAuthenticated = false;
    mockAuth.user = null;
  });

  describe("when rendered", () => {
    it("then shows the share button", () => {
      renderTitleBar();
      expect(screen.getByTestId("shareButton")).toBeInTheDocument();
    });

    it("then shows the title text", () => {
      renderTitleBar();
      expect(screen.getByText("Title")).toBeInTheDocument();
    });
  });

  describe("when the share button is clicked", () => {
    it("then opens the share dialog", () => {
      renderTitleBar();
      fireEvent.click(screen.getByTestId("shareButton"));
      expect(screen.getByTestId("shareDialog")).toBeInTheDocument();
    });
  });

  describe("when readOnly is true", () => {
    it("then does not enter editing mode on title click", () => {
      renderTitleBar({ readOnly: true });
      fireEvent.click(screen.getByText("Title"));
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  describe("when readOnly is false", () => {
    it("then enters editing mode on title click", () => {
      renderTitleBar({ readOnly: false });
      fireEvent.click(screen.getByText("Title"));
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });

  describe("workspace switcher", () => {
    it("shows home button when navigate is provided but user is not authenticated", () => {
      const navigate = vi.fn();
      renderWithWorkspace(<TitleBar navigate={navigate} />);
      expect(screen.getByTestId("homeButton")).toBeInTheDocument();
      expect(screen.queryByTestId("workspaceSwitcher")).not.toBeInTheDocument();
    });

    it("shows workspace switcher when authenticated with workspaces", () => {
      mockAuth.isAuthenticated = true;
      mockAuth.user = {
        id: "1",
        email: "test@test.com",
        name: "Test User",
        avatarUrl: "",
      };
      mockWorkspaces.workspaces = [
        {
          workspaceId: "ws-1",
          title: "Workspace 1",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          isFavorite: false,
          folderId: null,
        },
        {
          workspaceId: "ws-2",
          title: "Workspace 2",
          createdAt: "2026-01-02",
          updatedAt: "2026-01-02",
          isFavorite: false,
          folderId: null,
        },
      ];

      const navigate = vi.fn();
      renderWithWorkspace(<TitleBar navigate={navigate} />);
      expect(screen.getByTestId("workspaceSwitcher")).toBeInTheDocument();
      expect(screen.queryByTestId("homeButton")).not.toBeInTheDocument();
    });

    it("shows home button when authenticated but no workspaces exist", () => {
      mockAuth.isAuthenticated = true;
      mockAuth.user = {
        id: "1",
        email: "test@test.com",
        name: "Test User",
        avatarUrl: "",
      };
      mockWorkspaces.workspaces = [];

      const navigate = vi.fn();
      renderWithWorkspace(<TitleBar navigate={navigate} />);
      expect(screen.getByTestId("homeButton")).toBeInTheDocument();
      expect(screen.queryByTestId("workspaceSwitcher")).not.toBeInTheDocument();
    });

    it("does not show switcher or home button when navigate is not provided", () => {
      mockAuth.isAuthenticated = true;
      mockWorkspaces.workspaces = [
        {
          workspaceId: "ws-1",
          title: "Workspace 1",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          isFavorite: false,
          folderId: null,
        },
      ];

      renderTitleBar();
      expect(screen.queryByTestId("homeButton")).not.toBeInTheDocument();
      expect(screen.queryByTestId("workspaceSwitcher")).not.toBeInTheDocument();
    });
  });
});
