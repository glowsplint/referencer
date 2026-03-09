import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TitleBar } from "./TitleBar";
import { renderWithDocument } from "@/test/render-with-document";
import type { DocumentItem } from "@/lib/document-client";

const mockDocuments = {
  documents: [] as DocumentItem[],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  create: vi.fn(),
  rename: vi.fn(),
  remove: vi.fn(),
  duplicate: vi.fn(),
  toggleFavorite: vi.fn(),
  moveToFolder: vi.fn(),
  unfileDocument: vi.fn(),
};

vi.mock("@/hooks/data/use-documents", () => ({
  useDocuments: () => mockDocuments,
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
  return renderWithDocument(<TitleBar />, overrides);
}

describe("TitleBar", () => {
  beforeEach(() => {
    mockDocuments.documents = [];
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

  describe("document switcher", () => {
    it("shows home button when navigate is provided but user is not authenticated", () => {
      const navigate = vi.fn();
      renderWithDocument(<TitleBar navigate={navigate} />);
      expect(screen.getByTestId("homeButton")).toBeInTheDocument();
      expect(screen.queryByTestId("documentSwitcher")).not.toBeInTheDocument();
    });

    it("shows document switcher when authenticated with documents", () => {
      mockAuth.isAuthenticated = true;
      mockAuth.user = {
        id: "1",
        email: "test@test.com",
        name: "Test User",
        avatarUrl: "",
      };
      mockDocuments.documents = [
        {
          documentId: "ws-1",
          title: "Document 1",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          isFavorite: false,
          folderId: null,
        },
        {
          documentId: "ws-2",
          title: "Document 2",
          createdAt: "2026-01-02",
          updatedAt: "2026-01-02",
          isFavorite: false,
          folderId: null,
        },
      ];

      const navigate = vi.fn();
      renderWithDocument(<TitleBar navigate={navigate} />);
      expect(screen.getByTestId("documentSwitcher")).toBeInTheDocument();
      expect(screen.queryByTestId("homeButton")).not.toBeInTheDocument();
    });

    it("shows home button when authenticated but no documents exist", () => {
      mockAuth.isAuthenticated = true;
      mockAuth.user = {
        id: "1",
        email: "test@test.com",
        name: "Test User",
        avatarUrl: "",
      };
      mockDocuments.documents = [];

      const navigate = vi.fn();
      renderWithDocument(<TitleBar navigate={navigate} />);
      expect(screen.getByTestId("homeButton")).toBeInTheDocument();
      expect(screen.queryByTestId("documentSwitcher")).not.toBeInTheDocument();
    });

    it("does not show switcher or home button when navigate is not provided", () => {
      mockAuth.isAuthenticated = true;
      mockDocuments.documents = [
        {
          documentId: "ws-1",
          title: "Document 1",
          createdAt: "2026-01-01",
          updatedAt: "2026-01-01",
          isFavorite: false,
          folderId: null,
        },
      ];

      renderTitleBar();
      expect(screen.queryByTestId("homeButton")).not.toBeInTheDocument();
      expect(screen.queryByTestId("documentSwitcher")).not.toBeInTheDocument();
    });
  });

  describe("connection status indicator", () => {
    it("shows green dot and 'Connected' label when connected", () => {
      renderTitleBar({
        wsConnected: true,
        yjs: {
          provider: null,
          doc: null,
          connected: true,
          connectionState: "connected" as const,
          synced: true,
          getFragment: () => null,
          awareness: null,
        },
      });
      const dot = screen.getByTestId("connectionStatusDot");
      expect(dot).toHaveClass("bg-green-500");
      expect(screen.getByTestId("connectionStatusLabel")).toHaveTextContent("Connected");
    });

    it("shows amber dot and 'Reconnecting...' label when reconnecting", () => {
      renderTitleBar({
        wsConnected: false,
        yjs: {
          provider: null,
          doc: null,
          connected: false,
          connectionState: "reconnecting" as const,
          synced: false,
          getFragment: () => null,
          awareness: null,
        },
      });
      const dot = screen.getByTestId("connectionStatusDot");
      expect(dot).toHaveClass("bg-amber-500");
      expect(screen.getByTestId("connectionStatusLabel")).toHaveTextContent("Reconnecting...");
    });

    it("shows gray dot and 'Offline' label when offline", () => {
      renderTitleBar({
        wsConnected: false,
        yjs: {
          provider: null,
          doc: null,
          connected: false,
          connectionState: "offline" as const,
          synced: false,
          getFragment: () => null,
          awareness: null,
        },
      });
      const dot = screen.getByTestId("connectionStatusDot");
      expect(dot).toHaveClass("bg-gray-400");
      expect(screen.getByTestId("connectionStatusLabel")).toHaveTextContent("Offline");
    });

    it("shows red dot and 'Unstable connection' label when unstable", () => {
      renderTitleBar({
        wsConnected: false,
        yjs: {
          provider: null,
          doc: null,
          connected: false,
          connectionState: "unstable" as const,
          synced: false,
          getFragment: () => null,
          awareness: null,
        },
      });
      const dot = screen.getByTestId("connectionStatusDot");
      expect(dot).toHaveClass("bg-red-500");
      expect(screen.getByTestId("connectionStatusLabel")).toHaveTextContent("Unstable connection");
    });
  });
});
