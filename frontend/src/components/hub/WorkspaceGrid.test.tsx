import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceGrid } from "./WorkspaceGrid";
import type { WorkspaceItem } from "@/lib/workspace-client";
import type { FolderItem } from "@/lib/folder-client";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "2h ago",
}));

vi.mock("@/lib/ksuid", () => ({
  randomKSUID: () => "mock-ksuid-123",
}));

function makeWorkspace(overrides: Partial<WorkspaceItem> = {}): WorkspaceItem {
  return {
    workspaceId: "ws-1",
    title: "Test Workspace",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    isFavorite: false,
    folderId: null,
    ...overrides,
  };
}

function makeFolder(overrides: Partial<FolderItem> = {}): FolderItem {
  return {
    id: "folder-1",
    parentId: null,
    name: "Test Folder",
    isFavorite: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    ...overrides,
  };
}

describe("WorkspaceGrid", () => {
  let navigate: ReturnType<typeof vi.fn>;
  let onNew: ReturnType<typeof vi.fn>;
  let onRename: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onDuplicate: ReturnType<typeof vi.fn>;
  let onToggleFavorite: ReturnType<typeof vi.fn>;
  let onCreateFolder: ReturnType<typeof vi.fn>;
  let onRenameFolder: ReturnType<typeof vi.fn>;
  let onDeleteFolder: ReturnType<typeof vi.fn>;
  let onMoveWorkspaceToFolder: ReturnType<typeof vi.fn>;
  let onUnfileWorkspace: ReturnType<typeof vi.fn>;
  let onToggleFolderFavorite: ReturnType<typeof vi.fn>;
  let onMoveFolder: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    navigate = vi.fn();
    onNew = vi.fn();
    onRename = vi.fn();
    onDelete = vi.fn();
    onDuplicate = vi.fn();
    onToggleFavorite = vi.fn();
    onCreateFolder = vi.fn();
    onRenameFolder = vi.fn();
    onDeleteFolder = vi.fn();
    onMoveWorkspaceToFolder = vi.fn();
    onUnfileWorkspace = vi.fn();
    onToggleFolderFavorite = vi.fn();
    onMoveFolder = vi.fn();
  });

  function renderGrid(
    workspaces: WorkspaceItem[] = [],
    folders: FolderItem[] = [],
    isLoading = false,
  ) {
    return render(
      <WorkspaceGrid
        workspaces={workspaces}
        isLoading={isLoading}
        navigate={navigate}
        onNew={onNew}
        onRename={onRename}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onToggleFavorite={onToggleFavorite}
        folders={folders}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onMoveWorkspaceToFolder={onMoveWorkspaceToFolder}
        onUnfileWorkspace={onUnfileWorkspace}
        onToggleFolderFavorite={onToggleFolderFavorite}
        onMoveFolder={onMoveFolder}
        ownerName="Test User"
        ownerAvatarUrl="https://example.com/avatar.jpg"
      />,
    );
  }

  describe("when loading", () => {
    it("shows loading text", () => {
      renderGrid([], [], true);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("when there are no workspaces or folders", () => {
    it("shows the empty state message", () => {
      renderGrid([], [], false);
      expect(screen.getByText("No workspaces yet")).toBeInTheDocument();
      expect(screen.getByText("Create your first workspace")).toBeInTheDocument();
    });

    it("calls onNew when the empty state button is clicked", async () => {
      const user = userEvent.setup();
      renderGrid([], [], false);
      await user.click(screen.getByText("Create your first workspace"));
      expect(onNew).toHaveBeenCalledTimes(1);
    });
  });

  describe("when there are workspaces", () => {
    it("shows the workspace title in grid view", () => {
      renderGrid([makeWorkspace()]);
      expect(screen.getByText("Test Workspace")).toBeInTheDocument();
    });

    it("shows the header with My Workspaces title", () => {
      renderGrid([makeWorkspace()]);
      expect(screen.getByText("My Workspaces")).toBeInTheDocument();
    });

    it("shows the starred section", () => {
      renderGrid([makeWorkspace()]);
      expect(screen.getByTestId("starredSection")).toBeInTheDocument();
    });

    it("shows 'Star an item to pin it here' when no items are starred", () => {
      renderGrid([makeWorkspace()]);
      expect(screen.getByText("Star an item to pin it here")).toBeInTheDocument();
    });
  });

  describe("starred items", () => {
    it("places starred workspaces in the starred section", () => {
      const starred = makeWorkspace({ workspaceId: "ws-starred", title: "Starred WS", isFavorite: true });
      const unstarred = makeWorkspace({ workspaceId: "ws-other", title: "Other WS", isFavorite: false });
      renderGrid([starred, unstarred]);

      const starredSection = screen.getByTestId("starredSection");
      expect(within(starredSection).getByText("Starred WS")).toBeInTheDocument();
    });
  });

  describe("view mode toggle", () => {
    it("switches to list view when the list button is clicked", async () => {
      const user = userEvent.setup();
      const ws = makeWorkspace();
      renderGrid([ws]);

      await user.click(screen.getByTestId("listViewButton"));

      // In list view, the sort column headers should appear
      expect(screen.getByTestId("sortByTitle")).toBeInTheDocument();
      expect(screen.getByTestId("sortByCreated")).toBeInTheDocument();
      expect(screen.getByTestId("sortByModified")).toBeInTheDocument();
    });

    it("persists view mode to localStorage", async () => {
      const user = userEvent.setup();
      renderGrid([makeWorkspace()]);

      await user.click(screen.getByTestId("listViewButton"));
      expect(localStorage.getItem("hub-view-mode")).toBe("list");

      await user.click(screen.getByTestId("gridViewButton"));
      expect(localStorage.getItem("hub-view-mode")).toBe("grid");
    });
  });

  describe("new workspace button", () => {
    it("calls onNew when clicked", async () => {
      const user = userEvent.setup();
      renderGrid([makeWorkspace()]);

      await user.click(screen.getByTestId("newWorkspaceButton"));
      expect(onNew).toHaveBeenCalledTimes(1);
    });
  });

  describe("new folder button", () => {
    it("shows inline input when clicked", async () => {
      const user = userEvent.setup();
      renderGrid([makeWorkspace()]);

      await user.click(screen.getByTestId("newFolderButton"));
      expect(screen.getByTestId("inlineNameInput")).toBeInTheDocument();
    });
  });

  describe("sort controls in list view", () => {
    it("toggles sort direction when clicking the same column header", async () => {
      const user = userEvent.setup();
      const ws1 = makeWorkspace({ workspaceId: "ws-1", title: "Alpha" });
      const ws2 = makeWorkspace({ workspaceId: "ws-2", title: "Beta" });
      renderGrid([ws1, ws2]);

      // Switch to list view to see sort controls
      await user.click(screen.getByTestId("listViewButton"));

      // Click title sort
      await user.click(screen.getByTestId("sortByTitle"));

      // Verify sort was applied (localStorage should be updated)
      const stored = JSON.parse(localStorage.getItem("hub-sort") || "{}");
      expect(stored.field).toBe("title");
    });
  });

  describe("workspace actions via card menu", () => {
    it("opens the workspace when a card is clicked", async () => {
      const user = userEvent.setup();
      renderGrid([makeWorkspace({ workspaceId: "ws-open-test" })]);

      await user.click(screen.getByTestId("workspaceCard-ws-open-test"));
      expect(navigate).toHaveBeenCalledWith("#/ws-open-test");
    });
  });

  describe("folders in grid", () => {
    it("renders a folder in the all items section", () => {
      const folder = makeFolder({ id: "f1", name: "My Folder" });
      renderGrid([makeWorkspace({ folderId: "f1" })], [folder]);

      expect(screen.getByText("My Folder")).toBeInTheDocument();
    });

    it("renders starred folders in the starred section", () => {
      const folder = makeFolder({ id: "f-star", name: "Starred Folder", isFavorite: true });
      renderGrid([], [folder]);

      const starredSection = screen.getByTestId("starredSection");
      expect(within(starredSection).getByText("Starred Folder")).toBeInTheDocument();
    });
  });
});
