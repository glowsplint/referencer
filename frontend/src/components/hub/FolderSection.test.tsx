import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderSection } from "./FolderSection";
import { DndProvider } from "@/contexts/DndContext";
import type { FolderNode } from "@/lib/folder-tree";
import type { WorkspaceItem } from "@/lib/workspace-client";
import type { FolderItem } from "@/lib/folder-client";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "2h ago",
}));

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

function makeWorkspace(overrides: Partial<WorkspaceItem> = {}): WorkspaceItem {
  return {
    workspaceId: "ws-1",
    title: "Test Workspace",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    isFavorite: false,
    folderId: "folder-1",
    ...overrides,
  };
}

function makeNode(overrides: Partial<FolderNode> = {}): FolderNode {
  return {
    folder: makeFolder(),
    children: [],
    depth: 0,
    ...overrides,
  };
}

describe("FolderSection", () => {
  const defaultProps = {
    workspaces: [] as WorkspaceItem[],
    folders: [makeFolder()] as FolderItem[],
    viewMode: "grid" as const,
    renamingFolderId: null,
    creatingSubfolderId: null,
    onSetRenamingFolder: vi.fn(),
    onSetCreatingSubfolder: vi.fn(),
    onRenameFolder: vi.fn(),
    onDeleteFolder: vi.fn(),
    onCreateFolder: vi.fn(),
    onOpenWorkspace: vi.fn(),
    onRenameWorkspace: vi.fn(),
    onDuplicateWorkspace: vi.fn(),
    onDeleteWorkspace: vi.fn(),
    onToggleFavorite: vi.fn(),
    onToggleFolderFavorite: vi.fn(),
    onMoveToFolder: vi.fn(),
    onMoveFolder: vi.fn(),
    ownerName: "Test User",
    ownerAvatarUrl: "https://example.com/avatar.jpg",
  };

  function renderSection(node: FolderNode = makeNode(), overrides = {}) {
    return render(
      <DndProvider>
        <FolderSection node={node} {...defaultProps} {...overrides} />
      </DndProvider>,
    );
  }

  describe("when rendered", () => {
    it("then shows the folder name", () => {
      renderSection(makeNode({ folder: makeFolder({ name: "My Notes" }) }));
      expect(screen.getByText("My Notes")).toBeInTheDocument();
    });

    it("then shows the workspace count for the folder", () => {
      const ws = makeWorkspace();
      renderSection(makeNode(), { workspaces: [ws] });
      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("when expanded with workspaces", () => {
    it("then shows workspaces inside the folder", () => {
      const ws = makeWorkspace({ title: "Inside WS" });
      renderSection(makeNode(), { workspaces: [ws] });
      expect(screen.getByText("Inside WS")).toBeInTheDocument();
    });
  });

  describe("when the folder header is clicked", () => {
    it("then toggles collapse", async () => {
      const user = userEvent.setup();
      const ws = makeWorkspace({ title: "Inside WS" });
      renderSection(makeNode({ folder: makeFolder({ name: "My Folder" }) }), { workspaces: [ws] });

      // Initially expanded, workspace visible
      expect(screen.getByText("Inside WS")).toBeInTheDocument();

      // Click the folder name text to trigger collapse (the header row onClick)
      await user.click(screen.getByText("My Folder"));
      expect(screen.queryByText("Inside WS")).not.toBeInTheDocument();
    });
  });

  describe("when folder has child folders", () => {
    it("then renders child folders recursively", () => {
      const childFolder = makeFolder({ id: "child-1", parentId: "folder-1", name: "Child Folder" });
      const childNode: FolderNode = {
        folder: childFolder,
        children: [],
        depth: 1,
      };
      const parentNode = makeNode({ children: [childNode] });

      renderSection(parentNode, { folders: [makeFolder(), childFolder] });
      expect(screen.getByText("Child Folder")).toBeInTheDocument();
    });
  });

  describe("when the folder is being renamed", () => {
    it("then shows inline rename input", () => {
      renderSection(makeNode(), { renamingFolderId: "folder-1" });
      expect(screen.getByTestId("inlineNameInput")).toBeInTheDocument();
    });
  });

  describe("when creating a subfolder", () => {
    it("then shows inline input", () => {
      renderSection(makeNode(), { creatingSubfolderId: "folder-1" });
      expect(screen.getByTestId("inlineNameInput")).toBeInTheDocument();
    });
  });

  describe("when the star button is clicked", () => {
    it("then calls onToggleFolderFavorite", async () => {
      const user = userEvent.setup();
      const onToggleFolderFavorite = vi.fn();
      renderSection(makeNode(), { onToggleFolderFavorite });

      await user.click(screen.getByTestId("folderFavoriteToggle"));
      expect(onToggleFolderFavorite).toHaveBeenCalledWith("folder-1", true);
    });
  });

  describe("when viewMode is list", () => {
    it("then renders workspaces in list view", () => {
      const ws = makeWorkspace({ title: "List WS" });
      renderSection(makeNode(), { workspaces: [ws], viewMode: "list" });
      expect(screen.getByText("List WS")).toBeInTheDocument();
    });
  });
});
