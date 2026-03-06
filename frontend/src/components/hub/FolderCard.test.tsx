import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderCard } from "./FolderCard";
import { DndProvider } from "@/contexts/DndContext";
import { SelectionProvider } from "@/contexts/SelectionContext";
import type { FolderNode } from "@/lib/folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import type { DocumentItem } from "@/lib/document-client";

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

function makeDocument(overrides: Partial<DocumentItem> & { documentId: string }): DocumentItem {
  return {
    title: "Document",
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
  let onOpenDocument: ReturnType<typeof vi.fn>;
  let onNavigateToFolder: ReturnType<typeof vi.fn>;
  const noopFn = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    onToggleFolderFavorite = vi.fn();
    onOpenDocument = vi.fn();
    onNavigateToFolder = vi.fn();
  });

  function renderCard(opts?: {
    node?: FolderNode;
    documents?: DocumentItem[];
    folders?: FolderItem[];
  }) {
    const n = opts?.node ?? node;
    const orderedIds = [n.folder.id];
    const itemTypes = new Map([[n.folder.id, "folder" as const]]);
    return render(
      <DndProvider>
        <SelectionProvider orderedIds={orderedIds} itemTypes={itemTypes}>
          <FolderCard
            node={n}
            documents={opts?.documents ?? []}
            folders={opts?.folders ?? folders}
            viewMode="grid"
            renamingFolderId={null}
            creatingSubfolderId={null}
            onSetRenamingFolder={noopFn}
            onSetCreatingSubfolder={noopFn}
            onRenameFolder={noopFn}
            onDeleteFolder={noopFn}
            onCreateFolder={noopFn}
            onOpenDocument={onOpenDocument}
            onRenameDocument={noopFn}
            onDuplicateDocument={noopFn}
            onDeleteDocument={noopFn}
            onToggleFavorite={noopFn}
            onToggleFolderFavorite={onToggleFolderFavorite}
            onMoveToFolder={noopFn}
            onMoveFolder={noopFn}
            onNavigateToFolder={onNavigateToFolder}
          />
        </SelectionProvider>
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

  describe("when folder has no documents", () => {
    it("then displays document count of 0", () => {
      renderCard();
      expect(screen.getByText("0 items")).toBeInTheDocument();
    });
  });

  describe("when folder has documents", () => {
    it("then displays the document count", () => {
      const documents = [
        makeDocument({ documentId: "ws-1", folderId: "f1" }),
        makeDocument({ documentId: "ws-2", folderId: "f1" }),
      ];
      renderCard({ documents });
      expect(screen.getByText("2 items")).toBeInTheDocument();
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

  describe("when Open is clicked in the dropdown menu", () => {
    it("then calls onNavigateToFolder with the folder id", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("folderMenu"));
      await user.click(screen.getByText("Open"));

      expect(onNavigateToFolder).toHaveBeenCalledWith("f1");
    });
  });

  describe("when the folder card is double-clicked", () => {
    it("then calls onNavigateToFolder with the folder id", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.dblClick(screen.getByTestId("folderCard-f1"));

      expect(onNavigateToFolder).toHaveBeenCalledWith("f1");
    });
  });
});
