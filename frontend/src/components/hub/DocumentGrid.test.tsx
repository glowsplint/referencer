import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocumentGrid } from "./DocumentGrid";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { DocumentItem } from "@/lib/document-client";
import type { FolderItem } from "@/lib/folder-client";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "2h ago",
}));

vi.mock("@/lib/ksuid", () => ({
  randomKSUID: () => "mock-ksuid-123",
}));

function makeDocument(overrides: Partial<DocumentItem> = {}): DocumentItem {
  return {
    documentId: "ws-1",
    title: "Test Document",
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

describe("DocumentGrid", () => {
  let navigate: ReturnType<typeof vi.fn>;
  let onNew: ReturnType<typeof vi.fn>;
  let onRename: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onDuplicate: ReturnType<typeof vi.fn>;
  let onToggleFavorite: ReturnType<typeof vi.fn>;
  let onCreateFolder: ReturnType<typeof vi.fn>;
  let onRenameFolder: ReturnType<typeof vi.fn>;
  let onDeleteFolder: ReturnType<typeof vi.fn>;
  let onMoveDocumentToFolder: ReturnType<typeof vi.fn>;
  let onUnfileDocument: ReturnType<typeof vi.fn>;
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
    onMoveDocumentToFolder = vi.fn();
    onUnfileDocument = vi.fn();
    onToggleFolderFavorite = vi.fn();
    onMoveFolder = vi.fn();
  });

  function renderGrid(
    documents: DocumentItem[] = [],
    folders: FolderItem[] = [],
    isLoading = false,
  ) {
    return render(
      <DocumentGrid
        documents={documents}
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
        onMoveDocumentToFolder={onMoveDocumentToFolder}
        onUnfileDocument={onUnfileDocument}
        onToggleFolderFavorite={onToggleFolderFavorite}
        onMoveFolder={onMoveFolder}
        ownerName="Test User"
        ownerAvatarUrl="https://example.com/avatar.jpg"
        searchQuery=""
      />,
    );
  }

  describe("when loading", () => {
    it("then shows loading text", () => {
      renderGrid([], [], true);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("when there are no documents or folders", () => {
    it("then shows the empty state onboarding", () => {
      renderGrid([], [], false);
      expect(screen.getByTestId("emptyStateOnboarding")).toBeInTheDocument();
      expect(screen.getByText("Welcome to Referencer")).toBeInTheDocument();
      expect(screen.getByText("Create your first document")).toBeInTheDocument();
    });

    it("then calls onNew with null when the empty state button is clicked", async () => {
      const user = userEvent.setup();
      renderGrid([], [], false);
      await user.click(screen.getByText("Create your first document"));
      expect(onNew).toHaveBeenCalledWith(null);
    });
  });

  describe("when there are documents", () => {
    it("then shows the document title in grid view", () => {
      renderGrid([makeDocument()]);
      expect(screen.getByText("Test Document")).toBeInTheDocument();
    });

    it("then shows the header with My Documents title", () => {
      renderGrid([makeDocument()]);
      expect(screen.getByText("My Documents")).toBeInTheDocument();
    });

    it("then shows the starred section at root level", () => {
      renderGrid([makeDocument()]);
      expect(screen.getByTestId("starredSection")).toBeInTheDocument();
    });

    it("then shows 'Star an item to pin it here' when no items are starred", () => {
      renderGrid([makeDocument()]);
      expect(screen.getByText("Star an item to pin it here")).toBeInTheDocument();
    });
  });

  describe("when starred items exist", () => {
    it("then places starred documents in the starred section", () => {
      const starred = makeDocument({
        documentId: "ws-starred",
        title: "Starred WS",
        isFavorite: true,
      });
      const unstarred = makeDocument({
        documentId: "ws-other",
        title: "Other WS",
        isFavorite: false,
      });
      renderGrid([starred, unstarred]);

      const starredSection = screen.getByTestId("starredSection");
      expect(within(starredSection).getByText("Starred WS")).toBeInTheDocument();
    });
  });

  describe("when view mode is toggled", () => {
    it("then switches to list view when the list button is clicked", async () => {
      const user = userEvent.setup();
      const ws = makeDocument();
      renderGrid([ws]);

      await user.click(screen.getByTestId("listViewButton"));

      // In list view, the sort column headers should appear
      expect(screen.getByTestId("sortByTitle")).toBeInTheDocument();
      expect(screen.getByTestId("sortByCreated")).toBeInTheDocument();
      expect(screen.getByTestId("sortByModified")).toBeInTheDocument();
    });

    it("then persists view mode to localStorage", async () => {
      const user = userEvent.setup();
      renderGrid([makeDocument()]);

      await user.click(screen.getByTestId("listViewButton"));
      expect(localStorage.getItem("hub-view-mode")).toBe("list");

      await user.click(screen.getByTestId("gridViewButton"));
      expect(localStorage.getItem("hub-view-mode")).toBe("grid");
    });
  });

  describe("when new document button is clicked", () => {
    it("then calls onNew with null at root level", async () => {
      const user = userEvent.setup();
      renderGrid([makeDocument()]);

      await user.click(screen.getByTestId("newDocumentButton"));
      expect(onNew).toHaveBeenCalledWith(null);
    });

    it("then calls onNew with the current folder id when inside a folder", async () => {
      const user = userEvent.setup();
      const folder = makeFolder({ id: "f1", name: "Study Notes" });
      const ws = makeDocument({ documentId: "ws-1", folderId: "f1", title: "WS in folder" });
      renderGrid([ws], [folder]);

      // Navigate into folder
      await user.dblClick(screen.getByTestId("folderCard-f1"));
      await screen.findByTestId("folderBreadcrumb");

      // Click new document button
      await user.click(screen.getByTestId("newDocumentButton"));
      expect(onNew).toHaveBeenCalledWith("f1");
    });
  });

  describe("when new folder button is clicked", () => {
    it("then shows inline input", async () => {
      const user = userEvent.setup();
      renderGrid([makeDocument()]);

      await user.click(screen.getByTestId("newFolderButton"));
      expect(screen.getByTestId("inlineNameInput")).toBeInTheDocument();
    });
  });

  describe("when sort controls are used in list view", () => {
    it("then toggles sort direction when clicking the same column header", async () => {
      const user = userEvent.setup();
      const ws1 = makeDocument({ documentId: "ws-1", title: "Alpha" });
      const ws2 = makeDocument({ documentId: "ws-2", title: "Beta" });
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

  describe("when a document card is double-clicked", () => {
    it("then opens the document", async () => {
      const user = userEvent.setup();
      renderGrid([makeDocument({ documentId: "ws-open-test" })]);

      await user.dblClick(screen.getByTestId("documentCard-ws-open-test"));
      expect(navigate).toHaveBeenCalledWith("#/ws-open-test");
    });
  });

  describe("when folders exist in grid", () => {
    it("then renders a folder in the all items section", () => {
      const folder = makeFolder({ id: "f1", name: "My Folder" });
      renderGrid([makeDocument({ folderId: "f1" })], [folder]);

      expect(screen.getByText("My Folder")).toBeInTheDocument();
    });

    it("then renders starred folders in the starred section", () => {
      const folder = makeFolder({ id: "f-star", name: "Starred Folder", isFavorite: true });
      renderGrid([], [folder]);

      const starredSection = screen.getByTestId("starredSection");
      expect(within(starredSection).getByText("Starred Folder")).toBeInTheDocument();
    });
  });

  describe("when starred items are sorted", () => {
    it("then sorts starred documents by updatedAt desc by default", () => {
      const wsOld = makeDocument({
        documentId: "ws-old",
        title: "Old WS",
        isFavorite: true,
        updatedAt: "2026-01-01T00:00:00Z",
      });
      const wsNew = makeDocument({
        documentId: "ws-new",
        title: "New WS",
        isFavorite: true,
        updatedAt: "2026-01-10T00:00:00Z",
      });
      renderGrid([wsOld, wsNew]);

      const starredSection = screen.getByTestId("starredSection");
      const cards = within(starredSection).getAllByTestId(/^documentCard-/);
      // Default sort is updatedAt desc, so newer first
      expect(cards[0]).toHaveAttribute("data-testid", "documentCard-ws-new");
      expect(cards[1]).toHaveAttribute("data-testid", "documentCard-ws-old");
    });

    it("then re-sorts starred documents when sort config changes", async () => {
      const user = userEvent.setup();
      const wsAlpha = makeDocument({
        documentId: "ws-alpha",
        title: "Alpha",
        isFavorite: true,
        updatedAt: "2026-01-01T00:00:00Z",
      });
      const wsBeta = makeDocument({
        documentId: "ws-beta",
        title: "Beta",
        isFavorite: true,
        updatedAt: "2026-01-10T00:00:00Z",
      });
      // Also add an unstarred document so the all-items section renders list view controls
      const wsUnstarred = makeDocument({
        documentId: "ws-other",
        title: "Other",
        isFavorite: false,
      });
      renderGrid([wsAlpha, wsBeta, wsUnstarred]);

      // Switch to list view so sort controls are visible
      await user.click(screen.getByTestId("listViewButton"));

      // Sort by title ascending
      await user.click(screen.getByTestId("sortByTitle"));

      const starredSection = screen.getByTestId("starredSection");
      const items = within(starredSection).getAllByTestId(/^documentListItem-/);
      // Title asc => Alpha before Beta
      expect(items[0]).toHaveAttribute("data-testid", "documentListItem-ws-alpha");
      expect(items[1]).toHaveAttribute("data-testid", "documentListItem-ws-beta");
    });
  });

  describe("when folders and documents are mixed", () => {
    it("then renders folders before documents in the starred section", () => {
      const starredFolder = makeFolder({
        id: "f-star",
        name: "Starred Folder",
        isFavorite: true,
      });
      const starredWs = makeDocument({
        documentId: "ws-starred",
        title: "Starred WS",
        isFavorite: true,
      });
      renderGrid([starredWs], [starredFolder]);

      const starredSection = screen.getByTestId("starredSection");
      const allItems = within(starredSection).getAllByTestId(/^(folderCard|documentCard)-/);
      expect(allItems[0]).toHaveAttribute("data-testid", "folderCard-f-star");
      expect(allItems[1]).toHaveAttribute("data-testid", "documentCard-ws-starred");
    });

    it("then renders folders before documents in the all items section", () => {
      const folder = makeFolder({ id: "f1", name: "My Folder" });
      const ws = makeDocument({
        documentId: "ws-unfiled",
        title: "Unfiled WS",
        isFavorite: false,
        folderId: null,
      });
      renderGrid([ws], [folder]);

      const allItemsSection = screen.getByTestId("allItemsSection");
      const allCards = within(allItemsSection).getAllByTestId(/^(folderCard|documentCard)-/);
      expect(allCards[0]).toHaveAttribute("data-testid", "folderCard-f1");
      expect(allCards[1]).toHaveAttribute("data-testid", "documentCard-ws-unfiled");
    });

    it("then renders folders before documents in list view too", async () => {
      const user = userEvent.setup();
      const folder = makeFolder({ id: "f1", name: "Zebra Folder" });
      const ws = makeDocument({
        documentId: "ws-unfiled",
        title: "Alpha WS",
        isFavorite: false,
        folderId: null,
      });
      renderGrid([ws], [folder]);

      await user.click(screen.getByTestId("listViewButton"));

      const allItemsSection = screen.getByTestId("allItemsSection");
      const allListItems = within(allItemsSection).getAllByTestId(
        /^(folderListItem|documentListItem)-/,
      );
      // Even though "Alpha WS" < "Zebra Folder" alphabetically, folder should come first
      expect(allListItems[0]).toHaveAttribute("data-testid", "folderListItem-f1");
      expect(allListItems[1]).toHaveAttribute("data-testid", "documentListItem-ws-unfiled");
    });
  });

  describe("when a document is duplicated", () => {
    it("then copies the editor layout from source to new document in localStorage", async () => {
      const user = userEvent.setup();
      const sourceLayout = JSON.stringify({
        editorCount: 2,
        sectionNames: ["Text 1", "Text 2"],
        sectionVisibility: [true, true],
      });
      localStorage.setItem(`${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}ws-1`, sourceLayout);
      renderGrid([makeDocument()]);

      // Open context menu and click Duplicate
      await user.click(screen.getByTestId("documentCardMenu"));
      const duplicateItem = await screen.findByRole("menuitem", { name: /duplicate/i });
      await user.click(duplicateItem);

      expect(onDuplicate).toHaveBeenCalledWith("ws-1", "mock-ksuid-123");
      const copiedLayout = localStorage.getItem(
        `${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}mock-ksuid-123`,
      );
      expect(copiedLayout).toBe(sourceLayout);
    });

    it("then does not create a layout entry when the source has no persisted layout", async () => {
      const user = userEvent.setup();
      // No localStorage layout set for ws-1
      renderGrid([makeDocument()]);

      await user.click(screen.getByTestId("documentCardMenu"));
      const duplicateItem = await screen.findByRole("menuitem", { name: /duplicate/i });
      await user.click(duplicateItem);

      expect(onDuplicate).toHaveBeenCalledWith("ws-1", "mock-ksuid-123");
      expect(localStorage.getItem(`${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}mock-ksuid-123`)).toBeNull();
    });
  });

  describe("when navigating into a folder", () => {
    it("then hides the starred section and shows breadcrumb", async () => {
      const user = userEvent.setup();
      const folder = makeFolder({ id: "f1", name: "Study Notes" });
      const ws = makeDocument({ documentId: "ws-1", folderId: "f1", title: "WS in folder" });
      const unfiledWs = makeDocument({
        documentId: "ws-unfiled",
        title: "Unfiled",
        folderId: null,
      });
      renderGrid([ws, unfiledWs], [folder]);

      // Starred section visible at root
      expect(screen.getByTestId("starredSection")).toBeInTheDocument();
      // Breadcrumb not rendered at root
      expect(screen.queryByTestId("folderBreadcrumb")).not.toBeInTheDocument();

      // Double-click folder to navigate into it
      await user.dblClick(screen.getByTestId("folderCard-f1"));

      // Starred section should be hidden
      expect(screen.queryByTestId("starredSection")).not.toBeInTheDocument();
      // Breadcrumb should appear
      expect(screen.getByTestId("folderBreadcrumb")).toBeInTheDocument();
      expect(screen.getByTestId("breadcrumb-root")).toHaveTextContent("My Documents");
      expect(screen.getByTestId("breadcrumb-f1")).toHaveTextContent("Study Notes");

      // Should show document inside the folder
      expect(screen.getByText("WS in folder")).toBeInTheDocument();
      // Should NOT show unfiled document (it's at root level)
      expect(screen.queryByText("Unfiled")).not.toBeInTheDocument();
    });

    it("then navigates back to root when breadcrumb root is clicked", async () => {
      const user = userEvent.setup();
      const folder = makeFolder({ id: "f1", name: "Study Notes" });
      const unfiledWs = makeDocument({
        documentId: "ws-unfiled",
        title: "Unfiled",
        folderId: null,
      });
      renderGrid([unfiledWs], [folder]);

      // Navigate into folder
      await user.dblClick(screen.getByTestId("folderCard-f1"));
      expect(screen.queryByTestId("starredSection")).not.toBeInTheDocument();

      // Click breadcrumb root to go back
      await user.click(screen.getByTestId("breadcrumb-root"));

      // Starred section visible again
      expect(screen.getByTestId("starredSection")).toBeInTheDocument();
      // Breadcrumb disappears
      expect(screen.queryByTestId("folderBreadcrumb")).not.toBeInTheDocument();
      // Unfiled document visible again
      expect(screen.getByText("Unfiled")).toBeInTheDocument();
    });

    it("then shows child subfolders when inside a folder", async () => {
      const user = userEvent.setup();
      const parent = makeFolder({ id: "f1", name: "Parent" });
      const child = makeFolder({ id: "f2", name: "Child Folder", parentId: "f1" });
      renderGrid([], [parent, child]);

      // At root, should see parent folder
      expect(screen.getByText("Parent")).toBeInTheDocument();
      // Child is nested, not visible at root
      expect(screen.queryByTestId("folderCard-f2")).not.toBeInTheDocument();

      // Navigate into parent
      await user.dblClick(screen.getByTestId("folderCard-f1"));

      // Child should now be visible
      expect(screen.getByText("Child Folder")).toBeInTheDocument();
    });
  });
});
