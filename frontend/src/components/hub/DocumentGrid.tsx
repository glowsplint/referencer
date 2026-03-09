import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { randomKSUID } from "@/lib/ksuid";
import {
  LayoutGrid,
  List,
  Plus,
  FolderPlus,
  FolderInput,
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
  Folder,
  BookOpen,
  Highlighter,
  MessageSquare,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useDocumentSort } from "@/hooks/data/use-document-sort";
import { buildFolderTree } from "@/lib/folder-tree";
import type { FolderNode } from "@/lib/folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import { DndProvider } from "@/contexts/DndContext";
import { SelectionProvider, useSelection } from "@/contexts/SelectionContext";
import type { DragItemType } from "@/hooks/ui/use-hub-dnd";
import { DocumentCard } from "./DocumentCard";
import { DocumentListItem } from "./DocumentListItem";
import { FolderCard } from "./FolderCard";
import { FolderListItem } from "./FolderListItem";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import { RenameDialog } from "./RenameDialog";
import { DeleteDialog } from "./DeleteDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { InlineNameInput } from "./InlineNameInput";
import { TagFilterBar } from "./TagFilterBar";
import type { DocumentItem } from "@/lib/document-client";

type ViewMode = "grid" | "list";

type MixedItem =
  | { kind: "document"; document: DocumentItem }
  | { kind: "folder"; node: FolderNode };

interface DocumentGridProps {
  documents: DocumentItem[];
  isLoading: boolean;
  navigate: (hash: string) => void;
  onNew: (currentFolderId: string | null) => void;
  onRename: (documentId: string, title: string) => void;
  onDelete: (documentId: string) => void;
  onDuplicate: (sourceId: string, newId: string) => void;
  onToggleFavorite: (documentId: string, isFavorite: boolean) => void;
  folders: FolderItem[];
  onCreateFolder: (id: string, parentId: string | null, name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveDocumentToFolder: (documentId: string, folderId: string) => void;
  onUnfileDocument: (documentId: string) => void;
  onToggleFolderFavorite: (folderId: string, isFavorite: boolean) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
  searchQuery: string;
  allTags?: string[];
  documentTags?: Record<string, string[]>;
  onAddTag?: (documentId: string, tag: string) => void;
  onRemoveTag?: (documentId: string, tag: string) => void;
}

export function DocumentGrid({
  documents,
  isLoading,
  navigate,
  onNew,
  onRename,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  folders,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveDocumentToFolder,
  onUnfileDocument,
  onToggleFolderFavorite,
  onMoveFolder,
  ownerName,
  ownerAvatarUrl,
  searchQuery,
  allTags = [],
  documentTags = {},
  onAddTag,
  onRemoveTag,
}: DocumentGridProps) {
  const { t } = useTranslation("management");
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.HUB_VIEW_MODE) as ViewMode) || "grid";
  });
  const [renameTarget, setRenameTarget] = useState<DocumentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [creatingSubfolderId, setCreatingSubfolderId] = useState<string | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderItem | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const { sortConfig, setSort, compare } = useDocumentSort(documents);
  const folderTree = buildFolderTree(folders);

  const handleToggleTagFilter = useCallback((tag: string) => {
    setActiveTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleClearTagFilters = useCallback(() => {
    setActiveTagFilters([]);
  }, []);

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_KEYS.HUB_VIEW_MODE, mode);
    } catch {
      /* quota exceeded or unavailable */
    }
  };

  const handleOpen = (id: string) => navigate(`#/${id}`);

  const handleDuplicate = (sourceId: string) => {
    const newId = randomKSUID();
    // Copy editor layout (pane count, names, visibility) so the duplicate
    // opens with the same number of texts as the source document.
    try {
      const layout = localStorage.getItem(`${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${sourceId}`);
      if (layout) {
        localStorage.setItem(`${STORAGE_KEYS.EDITOR_LAYOUT_PREFIX}${newId}`, layout);
      }
    } catch {
      /* localStorage unavailable */
    }
    onDuplicate(sourceId, newId);
  };

  const handleCreateFolder = (parentId: string | null, name: string) => {
    const id = randomKSUID();
    onCreateFolder(id, parentId, name);
  };

  const handleMoveToFolder = (documentId: string, folderId: string | null) => {
    if (folderId) {
      onMoveDocumentToFolder(documentId, folderId);
    } else {
      onUnfileDocument(documentId);
    }
  };

  const handleNavigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const queryLower = searchQuery.toLowerCase();

  // Find folder nodes at the current level
  const currentLevelFolderNodes = useMemo(() => {
    if (currentFolderId === null) return folderTree;
    // Find the node for currentFolderId in the tree
    function findNode(nodes: FolderNode[]): FolderNode | null {
      for (const n of nodes) {
        if (n.folder.id === currentFolderId) return n;
        const found = findNode(n.children);
        if (found) return found;
      }
      return null;
    }
    const node = findNode(folderTree);
    return node ? node.children : [];
  }, [folderTree, currentFolderId]);

  // Starred section: only at root level
  const starredItems = useMemo(() => {
    if (currentFolderId !== null) return [];

    const items: MixedItem[] = [];

    // Starred root-level folders
    for (const node of folderTree) {
      if (node.folder.isFavorite) {
        if (!searchQuery || node.folder.name.toLowerCase().includes(queryLower)) {
          items.push({ kind: "folder", node });
        }
      }
    }

    // All starred documents
    for (const ws of documents) {
      if (ws.isFavorite) {
        if (!searchQuery || (ws.title || "Untitled").toLowerCase().includes(queryLower)) {
          if (
            activeTagFilters.length === 0 ||
            activeTagFilters.every((t) => (documentTags[ws.documentId] ?? []).includes(t))
          ) {
            items.push({ kind: "document", document: ws });
          }
        }
      }
    }

    // Sort: folders first, then by sortConfig
    items.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;

      if (a.kind === "document" && b.kind === "document") {
        return compare(a.document, b.document);
      }

      const { field, direction } = sortConfig;
      const getTitle = (item: MixedItem) =>
        item.kind === "document" ? item.document.title || "Untitled" : item.node.folder.name;
      const getDate = (item: MixedItem, f: "createdAt" | "updatedAt") =>
        item.kind === "document" ? item.document[f] : item.node.folder[f];

      let cmp = 0;
      if (field === "title") {
        cmp = getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: "base" });
      } else {
        cmp = getDate(a, field).localeCompare(getDate(b, field));
      }
      return direction === "asc" ? cmp : -cmp;
    });

    return items;
  }, [
    folderTree,
    documents,
    sortConfig,
    compare,
    searchQuery,
    queryLower,
    currentFolderId,
    activeTagFilters,
    documentTags,
  ]);

  // All Items section: items at the current folder level
  const allItems = useMemo(() => {
    const items: MixedItem[] = [];

    if (currentFolderId === null) {
      // Root level: unstarred root folders + unstarred unfiled documents
      for (const node of currentLevelFolderNodes) {
        if (!node.folder.isFavorite) {
          if (!searchQuery || node.folder.name.toLowerCase().includes(queryLower)) {
            items.push({ kind: "folder", node });
          }
        }
      }

      for (const ws of documents) {
        if (!ws.isFavorite && !ws.folderId) {
          if (!searchQuery || (ws.title || "Untitled").toLowerCase().includes(queryLower)) {
            if (
              activeTagFilters.length === 0 ||
              activeTagFilters.every((t) => (documentTags[ws.documentId] ?? []).includes(t))
            ) {
              items.push({ kind: "document", document: ws });
            }
          }
        }
      }
    } else {
      // Inside a folder: show direct child folders + documents in this folder
      for (const node of currentLevelFolderNodes) {
        if (!searchQuery || node.folder.name.toLowerCase().includes(queryLower)) {
          items.push({ kind: "folder", node });
        }
      }

      for (const ws of documents) {
        if (ws.folderId === currentFolderId) {
          if (!searchQuery || (ws.title || "Untitled").toLowerCase().includes(queryLower)) {
            if (
              activeTagFilters.length === 0 ||
              activeTagFilters.every((t) => (documentTags[ws.documentId] ?? []).includes(t))
            ) {
              items.push({ kind: "document", document: ws });
            }
          }
        }
      }
    }

    // Sort: folders first, then by sortConfig
    items.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;

      if (a.kind === "document" && b.kind === "document") {
        return compare(a.document, b.document);
      }

      const { field, direction } = sortConfig;
      const getTitle = (item: MixedItem) =>
        item.kind === "document" ? item.document.title || "Untitled" : item.node.folder.name;
      const getDate = (item: MixedItem, f: "createdAt" | "updatedAt") =>
        item.kind === "document" ? item.document[f] : item.node.folder[f];

      let cmp = 0;
      if (field === "title") {
        cmp = getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: "base" });
      } else {
        cmp = getDate(a, field).localeCompare(getDate(b, field));
      }
      return direction === "asc" ? cmp : -cmp;
    });

    return items;
  }, [
    currentFolderId,
    currentLevelFolderNodes,
    documents,
    sortConfig,
    compare,
    searchQuery,
    queryLower,
    activeTagFilters,
    documentTags,
  ]);

  // Compute orderedIds and itemTypes for SelectionProvider
  const { orderedIds, itemTypes } = useMemo(() => {
    const ids: string[] = [];
    const types = new Map<string, DragItemType>();
    const addItem = (item: MixedItem) => {
      if (item.kind === "document") {
        ids.push(item.document.documentId);
        types.set(item.document.documentId, "document");
      } else {
        ids.push(item.node.folder.id);
        types.set(item.node.folder.id, "folder");
      }
    };
    for (const item of starredItems) addItem(item);
    for (const item of allItems) addItem(item);
    return { orderedIds: ids, itemTypes: types };
  }, [starredItems, allItems]);

  // Shared folder props for FolderCard/FolderListItem
  const folderProps = {
    documents,
    folders,
    viewMode: viewMode as "grid" | "list",
    renamingFolderId,
    creatingSubfolderId,
    onSetRenamingFolder: setRenamingFolderId,
    onSetCreatingSubfolder: setCreatingSubfolderId,
    onRenameFolder,
    onDeleteFolder: setDeleteFolderTarget,
    onCreateFolder: handleCreateFolder,
    onOpenDocument: handleOpen,
    onRenameDocument: setRenameTarget,
    onDuplicateDocument: handleDuplicate,
    onDeleteDocument: setDeleteTarget,
    onToggleFavorite,
    onToggleFolderFavorite,
    onMoveToFolder: handleMoveToFolder,
    onMoveFolder,
    onNavigateToFolder: handleNavigateToFolder,
    ownerName,
    ownerAvatarUrl,
  };

  const renderItem = (item: MixedItem) => {
    if (item.kind === "document") {
      const ws = item.document;
      return viewMode === "grid" ? (
        <DocumentCard
          key={ws.documentId}
          document={ws}
          onOpen={() => handleOpen(ws.documentId)}
          onRename={() => setRenameTarget(ws)}
          onDuplicate={() => handleDuplicate(ws.documentId)}
          onDelete={() => setDeleteTarget(ws)}
          onToggleFavorite={onToggleFavorite}
          folders={folders}
          onMoveToFolder={handleMoveToFolder}
          ownerName={ownerName}
          ownerAvatarUrl={ownerAvatarUrl}
          tags={documentTags[ws.documentId]}
          allTags={allTags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      ) : (
        <DocumentListItem
          key={ws.documentId}
          document={ws}
          onOpen={() => handleOpen(ws.documentId)}
          onRename={() => setRenameTarget(ws)}
          onDuplicate={() => handleDuplicate(ws.documentId)}
          onDelete={() => setDeleteTarget(ws)}
          onToggleFavorite={onToggleFavorite}
          folders={folders}
          onMoveToFolder={handleMoveToFolder}
          ownerName={ownerName}
          ownerAvatarUrl={ownerAvatarUrl}
          tags={documentTags[ws.documentId]}
          allTags={allTags}
          onAddTag={onAddTag}
          onRemoveTag={onRemoveTag}
        />
      );
    } else {
      const { node } = item;
      return viewMode === "grid" ? (
        <FolderCard key={node.folder.id} node={node} {...folderProps} />
      ) : (
        <FolderListItem key={node.folder.id} node={node} {...folderProps} />
      );
    }
  };

  return (
    <DndProvider>
      <SelectionProvider orderedIds={orderedIds} itemTypes={itemTypes}>
        <DocumentGridInner>
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{t("hub.myDocuments")}</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-border rounded-md">
                <button
                  onClick={() => toggleView("grid")}
                  title={t("hub.gridView")}
                  className={`p-1.5 rounded-l-md transition-colors ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                  data-testid="gridViewButton"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => toggleView("list")}
                  title={t("hub.listView")}
                  className={`p-1.5 rounded-r-md transition-colors ${viewMode === "list" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                  data-testid="listViewButton"
                >
                  <List size={16} />
                </button>
              </div>
              <SelectionActions
                folders={folders}
                onDeleteDocument={onDelete}
                onDeleteFolder={onDeleteFolder}
                onMoveDocumentToFolder={onMoveDocumentToFolder}
                onUnfileDocument={onUnfileDocument}
                onMoveFolder={onMoveFolder}
              />
              <Button
                onClick={() => setCreatingFolder(true)}
                size="sm"
                variant="outline"
                data-testid="newFolderButton"
              >
                <FolderPlus size={16} />
                {t("hub.newFolder")}
              </Button>
              <Button
                onClick={() => onNew(currentFolderId)}
                size="sm"
                data-testid="newDocumentButton"
              >
                <Plus size={16} />
                {t("hub.newDocument")}
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t("hub.loading")}</div>
          ) : documents.length === 0 && folders.length === 0 ? (
            <div
              className="flex flex-col items-center py-16 px-4"
              data-testid="emptyStateOnboarding"
            >
              <h2 className="text-2xl font-bold mb-2">{t("hub.welcomeTitle")}</h2>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {t("hub.welcomeDescription")}
              </p>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 mb-8">
                <TriangleAlert size={16} className="shrink-0" />
                <span>{t("hub.alphaWarning")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-lg mb-8">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-sm font-medium">{t("hub.onboardingAddTexts")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("hub.onboardingAddTextsHint")}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <Highlighter size={20} />
                  </div>
                  <span className="text-sm font-medium">{t("hub.onboardingHighlight")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("hub.onboardingHighlightHint")}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-sm font-medium">{t("hub.onboardingComment")}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("hub.onboardingCommentHint")}
                  </span>
                </div>
              </div>
              <Button onClick={() => onNew(null)} size="lg">
                <Plus size={16} />
                {t("hub.createFirstDocument")}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Breadcrumb navigation */}
              <FolderBreadcrumb
                folders={folders}
                currentFolderId={currentFolderId}
                onNavigate={handleNavigateToFolder}
                onMoveToFolder={handleMoveToFolder}
                onMoveFolder={onMoveFolder}
              />

              {/* Tag filter bar */}
              <TagFilterBar
                allTags={allTags}
                activeTags={activeTagFilters}
                onToggleTag={handleToggleTagFilter}
                onClearFilters={handleClearTagFilters}
              />

              {/* Starred section — only at root level */}
              {currentFolderId === null && (
                <section data-testid="starredSection">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3">
                    <Star size={14} fill="currentColor" className="text-yellow-500" />
                    {t("hub.starred")}
                  </h3>
                  {starredItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 px-1">{t("hub.starHint")}</p>
                  ) : viewMode === "grid" ? (
                    <div data-testid="starredGrid" className="space-y-4">
                      {starredItems.some((i) => i.kind === "folder") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {starredItems.filter((i) => i.kind === "folder").map(renderItem)}
                        </div>
                      )}
                      {starredItems.some((i) => i.kind === "document") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {starredItems.filter((i) => i.kind === "document").map(renderItem)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">{starredItems.map(renderItem)}</div>
                  )}
                </section>
              )}

              {/* Divider — only at root level */}
              {currentFolderId === null && <hr className="border-border" />}

              {/* Inline input for new folder */}
              {creatingFolder && (
                <div className="flex items-center gap-1.5 py-2 px-1">
                  <Folder size={14} className="text-muted-foreground shrink-0" />
                  <InlineNameInput
                    onSave={(name) => {
                      handleCreateFolder(currentFolderId, name);
                      setCreatingFolder(false);
                    }}
                    onCancel={() => setCreatingFolder(false)}
                  />
                </div>
              )}

              {/* All Items section */}
              {allItems.length > 0 && (
                <section data-testid="allItemsSection">
                  {viewMode === "grid" ? (
                    <div data-testid="allItemsGrid" className="space-y-4">
                      {allItems.some((i) => i.kind === "folder") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {allItems.filter((i) => i.kind === "folder").map(renderItem)}
                        </div>
                      )}
                      {allItems.some((i) => i.kind === "document") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {allItems.filter((i) => i.kind === "document").map(renderItem)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border mb-1">
                        <div className="w-8" /> {/* star column */}
                        <button
                          onClick={() => setSort("title")}
                          className="flex items-center gap-1 flex-1"
                          data-testid="sortByTitle"
                        >
                          {t("hub.name")}{" "}
                          {sortConfig.field === "title" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            ))}
                        </button>
                        <button
                          onClick={() => setSort("createdAt")}
                          className="flex items-center gap-1 w-[120px] shrink-0"
                          data-testid="sortByCreated"
                        >
                          {t("hub.created")}{" "}
                          {sortConfig.field === "createdAt" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            ))}
                        </button>
                        <button
                          onClick={() => setSort("updatedAt")}
                          className="flex items-center gap-1 w-[120px] shrink-0"
                          data-testid="sortByModified"
                        >
                          {t("hub.modified")}{" "}
                          {sortConfig.field === "updatedAt" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            ))}
                        </button>
                        <div className="w-[140px] shrink-0">{t("hub.owner")}</div>
                        <div className="w-8" /> {/* menu column */}
                      </div>
                      {allItems.map(renderItem)}
                    </div>
                  )}
                </section>
              )}
            </div>
          )}

          {/* Dialogs */}
          <RenameDialog
            open={!!renameTarget}
            onOpenChange={(open) => {
              if (!open) setRenameTarget(null);
            }}
            currentTitle={renameTarget?.title ?? ""}
            onRename={(title) => {
              if (renameTarget) onRename(renameTarget.documentId, title);
              setRenameTarget(null);
            }}
          />
          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            documentTitle={deleteTarget?.title || t("hub.untitled")}
            onDelete={() => {
              if (deleteTarget) onDelete(deleteTarget.documentId);
              setDeleteTarget(null);
            }}
          />
          <DeleteFolderDialog
            open={!!deleteFolderTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteFolderTarget(null);
            }}
            folderName={deleteFolderTarget?.name || ""}
            onDelete={() => {
              if (deleteFolderTarget) onDeleteFolder(deleteFolderTarget.id);
              setDeleteFolderTarget(null);
            }}
          />
        </DocumentGridInner>
      </SelectionProvider>
    </DndProvider>
  );
}

/** Inner wrapper to access useSelection for deselection handlers */
function DocumentGridInner({ children }: { children: React.ReactNode }) {
  const { clearSelection, isSelectionActive } = useSelection();

  const handleEmptySpaceClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(
          '[data-selectable], button, a, input, [role="button"], [data-radix-dropdown-menu-content]',
        )
      ) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelectionActive) {
        clearSelection();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [clearSelection, isSelectionActive]);

  return <div onClick={handleEmptySpaceClick}>{children}</div>;
}

/** Folder option for the move dropdown */
function FolderMoveOption({
  node,
  onMove,
  indent,
}: {
  node: FolderNode;
  onMove: (folderId: string | null) => void;
  indent: number;
}) {
  return (
    <>
      <DropdownMenu.Item
        onSelect={() => onMove(node.folder.id)}
        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
        style={{ paddingLeft: `${12 + indent * 16}px` }}
      >
        {node.folder.name}
      </DropdownMenu.Item>
      {node.children.map((child) => (
        <FolderMoveOption key={child.folder.id} node={child} onMove={onMove} indent={indent + 1} />
      ))}
    </>
  );
}

/** Selection action buttons (Move, Delete) — rendered when items are selected */
function SelectionActions({
  folders,
  onDeleteDocument,
  onDeleteFolder,
  onMoveDocumentToFolder,
  onUnfileDocument,
  onMoveFolder,
}: {
  folders: FolderItem[];
  onDeleteDocument: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveDocumentToFolder: (documentId: string, folderId: string) => void;
  onUnfileDocument: (documentId: string) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
}) {
  const { t } = useTranslation("management");
  const { selectedIds, getSelectedItems, clearSelection, isSelectionActive } = useSelection();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isSelectionActive) return null;

  const handleDelete = () => {
    for (const item of getSelectedItems()) {
      if (item.type === "document") onDeleteDocument(item.id);
      else onDeleteFolder(item.id);
    }
    clearSelection();
    setShowDeleteConfirm(false);
  };

  const handleMove = (folderId: string | null) => {
    for (const item of getSelectedItems()) {
      if (item.type === "document") {
        if (folderId) onMoveDocumentToFolder(item.id, folderId);
        else onUnfileDocument(item.id);
      } else {
        onMoveFolder(item.id, folderId);
      }
    }
    clearSelection();
  };

  const tree = buildFolderTree(folders);

  return (
    <>
      <span className="text-sm text-muted-foreground" data-testid="selectionCount">
        {t("hub.selectedCount", { count: selectedIds.size })}
      </span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button size="sm" variant="outline" data-testid="bulkMoveButton">
            <FolderInput size={16} />
            {t("hub.moveTo")}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={4}
            className="z-50 min-w-[180px] max-h-[300px] overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
          >
            <DropdownMenu.Item
              onSelect={() => handleMove(null)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {t("hub.noFolder")}
            </DropdownMenu.Item>
            {tree.length > 0 && <DropdownMenu.Separator className="my-1 h-px bg-border" />}
            {tree.map((node) => (
              <FolderMoveOption key={node.folder.id} node={node} onMove={handleMove} indent={0} />
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:bg-destructive/10"
        onClick={() => setShowDeleteConfirm(true)}
        data-testid="bulkDeleteButton"
      >
        <Trash2 size={16} />
        {t("hub.delete")}
      </Button>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-sm" data-testid="deleteSelectedDialog">
          <DialogHeader>
            <DialogTitle>{t("hub.deleteSelectedTitle")}</DialogTitle>
            <DialogDescription>
              {t("hub.deleteSelectedConfirm", { count: selectedIds.size })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {t("hub.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-testid="confirmDeleteSelected"
            >
              {t("hub.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
