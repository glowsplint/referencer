import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderListItem } from "./FolderListItem";
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

describe("FolderListItem", () => {
  let onToggleFolderFavorite: ReturnType<typeof vi.fn>;
  let onOpenWorkspace: ReturnType<typeof vi.fn>;
  const noopFn = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onToggleFolderFavorite = vi.fn();
    onOpenWorkspace = vi.fn();
  });

  function renderListItem(opts?: {
    node?: FolderNode;
    workspaces?: WorkspaceItem[];
    folders?: FolderItem[];
  }) {
    return render(
      <DndProvider>
        <FolderListItem
          node={opts?.node ?? node}
          workspaces={opts?.workspaces ?? []}
          folders={opts?.folders ?? folders}
          viewMode="list"
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

  it("renders the folder name", () => {
    renderListItem();
    expect(screen.getByText("Test Folder")).toBeInTheDocument();
  });

  it("renders the test id with folder id", () => {
    renderListItem();
    expect(screen.getByTestId("folderListItem-f1")).toBeInTheDocument();
  });

  it("displays item count of 0 when folder has no workspaces", () => {
    renderListItem();
    expect(screen.getByText("0 items")).toBeInTheDocument();
  });

  it("displays item count when folder has workspaces", () => {
    const workspaces = [
      makeWorkspace({ workspaceId: "ws-1", folderId: "f1" }),
      makeWorkspace({ workspaceId: "ws-2", folderId: "f1" }),
      makeWorkspace({ workspaceId: "ws-3", folderId: "f1" }),
    ];
    renderListItem({ workspaces });
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("calls onToggleFolderFavorite when star is clicked", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("folderFavoriteToggle"));

    expect(onToggleFolderFavorite).toHaveBeenCalledWith("f1", true);
  });

  it("calls onToggleFolderFavorite with false when already favorited", async () => {
    const user = userEvent.setup();
    const favFolder = makeFolder({ id: "f1", name: "Fav Folder", isFavorite: true });
    const favNode: FolderNode = { folder: favFolder, children: [], depth: 0 };
    renderListItem({ node: favNode, folders: [favFolder] });

    await user.click(screen.getByTestId("folderFavoriteToggle"));

    expect(onToggleFolderFavorite).toHaveBeenCalledWith("f1", false);
  });

  it("toggles expand/collapse on click", async () => {
    const user = userEvent.setup();
    const workspaces = [makeWorkspace({ workspaceId: "ws-1", folderId: "f1", title: "Inside WS" })];
    renderListItem({ workspaces });

    // Initially expanded, so workspace should be visible
    expect(screen.getByText("Inside WS")).toBeInTheDocument();

    // Click to collapse
    await user.click(screen.getByTestId("folderListItem-f1").firstElementChild!);

    // After collapse, workspace should be hidden
    expect(screen.queryByText("Inside WS")).not.toBeInTheDocument();
  });
});
