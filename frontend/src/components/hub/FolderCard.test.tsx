import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderCard } from "./FolderCard";
import { DndProvider } from "@/contexts/DndContext";
import type { FolderNode } from "@/lib/folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import type { WorkspaceItem } from "@/lib/workspace-client";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "1d ago",
}));

function makeFolder(overrides: Partial<FolderItem> & { id: string }): FolderItem {
  return {
    parentId: null,
    name: "Folder",
    isFavorite: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeWorkspace(overrides: Partial<WorkspaceItem> & { workspaceId: string }): WorkspaceItem {
  return {
    title: "Workspace",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    isFavorite: false,
    folderId: null,
    ...overrides,
  };
}

const folder = makeFolder({ id: "f1", name: "Test Folder" });
const node: FolderNode = { folder, children: [], depth: 0 };
const folders = [folder];

describe("FolderCard", () => {
  let onToggleFolderFavorite: ReturnType<typeof vi.fn>;
  let onOpenWorkspace: ReturnType<typeof vi.fn>;
  const noopFn = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onToggleFolderFavorite = vi.fn();
    onOpenWorkspace = vi.fn();
  });

  function renderCard(opts?: {
    node?: FolderNode;
    workspaces?: WorkspaceItem[];
    folders?: FolderItem[];
  }) {
    return render(
      <DndProvider>
        <FolderCard
          node={opts?.node ?? node}
          workspaces={opts?.workspaces ?? []}
          folders={opts?.folders ?? folders}
          viewMode="grid"
          renamingFolderId={null}
          creatingSubfolderId={null}
          onSetRenamingFolder={noopFn}
          onSetCreatingSubfolder={noopFn}
          onRenameFolder={noopFn}
          onDeleteFolder={noopFn}
          onCreateFolder={noopFn}
          onOpenWorkspace={onOpenWorkspace}
          onRenameWorkspace={noopFn}
          onDuplicateWorkspace={noopFn}
          onDeleteWorkspace={noopFn}
          onToggleFavorite={noopFn}
          onToggleFolderFavorite={onToggleFolderFavorite}
          onMoveToFolder={noopFn}
          onMoveFolder={noopFn}
        />
      </DndProvider>,
    );
  }

  describe("when rendered", () => {
    it("then shows the folder name", () => {
      renderCard();
      expect(screen.getByText("Test Folder")).toBeInTheDocument();
    });

    it("then renders the test id with folder id", () => {
      renderCard();
      expect(screen.getByTestId("folderCard-f1")).toBeInTheDocument();
    });
  });

  describe("when folder has no workspaces", () => {
    it("then displays workspace count of 0", () => {
      renderCard();
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("when folder has workspaces", () => {
    it("then displays the workspace count", () => {
      const workspaces = [
        makeWorkspace({ workspaceId: "ws-1", folderId: "f1" }),
        makeWorkspace({ workspaceId: "ws-2", folderId: "f1" }),
      ];
      renderCard({ workspaces });
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("when star is clicked on a non-favorite folder", () => {
    it("then calls onToggleFolderFavorite with true", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("folderFavoriteToggle"));

      expect(onToggleFolderFavorite).toHaveBeenCalledWith("f1", true);
    });
  });

  describe("when star is clicked on a favorited folder", () => {
    it("then calls onToggleFolderFavorite with false", async () => {
      const user = userEvent.setup();
      const favFolder = makeFolder({ id: "f1", name: "Fav Folder", isFavorite: true });
      const favNode: FolderNode = { folder: favFolder, children: [], depth: 0 };
      renderCard({ node: favNode, folders: [favFolder] });

      await user.click(screen.getByTestId("folderFavoriteToggle"));

      expect(onToggleFolderFavorite).toHaveBeenCalledWith("f1", false);
    });
  });

  describe("when the folder header is clicked", () => {
    it("then toggles expand/collapse", async () => {
      const user = userEvent.setup();
      const workspaces = [makeWorkspace({ workspaceId: "ws-1", folderId: "f1", title: "Inside WS" })];
      renderCard({ workspaces });

      // Initially expanded (not collapsed), so workspace should be visible
      expect(screen.getByText("Inside WS")).toBeInTheDocument();

      // Click to collapse
      await user.click(screen.getByTestId("folderCard-f1").firstElementChild!);

      // After collapse, workspace should be hidden
      expect(screen.queryByText("Inside WS")).not.toBeInTheDocument();
    });
  });
});
