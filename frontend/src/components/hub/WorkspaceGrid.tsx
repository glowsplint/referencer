import { useCallback, useEffect, useMemo, useState } from "react";
import { randomKSUID } from "@/lib/ksuid";
import {
  LayoutGrid,
  List,
  Plus,
  FolderPlus,
  ChevronUp,
  ChevronDown,
  Star,
  Folder,
  Search,
  BookOpen,
  Highlighter,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useWorkspaceSort } from "@/hooks/data/use-workspace-sort";
import { buildFolderTree } from "@/lib/folder-tree";
import type { FolderNode } from "@/lib/folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import { DndProvider } from "@/contexts/DndContext";
import { SelectionProvider, useSelection } from "@/contexts/SelectionContext";
import type { DragItemType } from "@/hooks/ui/use-hub-dnd";
import { WorkspaceCard } from "./WorkspaceCard";
import { WorkspaceListItem } from "./WorkspaceListItem";
import { FolderCard } from "./FolderCard";
import { FolderListItem } from "./FolderListItem";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import { RenameDialog } from "./RenameDialog";
import { DeleteDialog } from "./DeleteDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { InlineNameInput } from "./InlineNameInput";
import type { WorkspaceItem } from "@/lib/workspace-client";

type ViewMode = "grid" | "list";

type MixedItem =
  | { kind: "workspace"; workspace: WorkspaceItem }
  | { kind: "folder"; node: FolderNode };

interface WorkspaceGridProps {
  workspaces: WorkspaceItem[];
  isLoading: boolean;
  navigate: (hash: string) => void;
  onNew: (currentFolderId: string | null) => void;
  onRename: (workspaceId: string, title: string) => void;
  onDelete: (workspaceId: string) => void;
  onDuplicate: (sourceId: string, newId: string) => void;
  onToggleFavorite: (workspaceId: string, isFavorite: boolean) => void;
  folders: FolderItem[];
  onCreateFolder: (id: string, parentId: string | null, name: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveWorkspaceToFolder: (workspaceId: string, folderId: string) => void;
  onUnfileWorkspace: (workspaceId: string) => void;
  onToggleFolderFavorite: (folderId: string, isFavorite: boolean) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
}

export function WorkspaceGrid({
  workspaces,
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
  onMoveWorkspaceToFolder,
  onUnfileWorkspace,
  onToggleFolderFavorite,
  onMoveFolder,
  ownerName,
  ownerAvatarUrl,
}: WorkspaceGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.HUB_VIEW_MODE) as ViewMode) || "grid";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [renameTarget, setRenameTarget] = useState<WorkspaceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [creatingSubfolderId, setCreatingSubfolderId] = useState<string | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderItem | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const { sortConfig, setSort, compare } = useWorkspaceSort(workspaces);

  const folderTree = buildFolderTree(folders);

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
    onDuplicate(sourceId, newId);
  };

  const handleCreateFolder = (parentId: string | null, name: string) => {
    const id = randomKSUID();
    onCreateFolder(id, parentId, name);
  };

  const handleMoveToFolder = (workspaceId: string, folderId: string | null) => {
    if (folderId) {
      onMoveWorkspaceToFolder(workspaceId, folderId);
    } else {
      onUnfileWorkspace(workspaceId);
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

    // All starred workspaces
    for (const ws of workspaces) {
      if (ws.isFavorite) {
        if (!searchQuery || (ws.title || "Untitled").toLowerCase().includes(queryLower)) {
          items.push({ kind: "workspace", workspace: ws });
        }
      }
    }

    // Sort: folders first, then by sortConfig
    items.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;

      if (a.kind === "workspace" && b.kind === "workspace") {
        return compare(a.workspace, b.workspace);
      }

      const { field, direction } = sortConfig;
      const getTitle = (item: MixedItem) =>
        item.kind === "workspace" ? item.workspace.title || "Untitled" : item.node.folder.name;
      const getDate = (item: MixedItem, f: "createdAt" | "updatedAt") =>
        item.kind === "workspace" ? item.workspace[f] : item.node.folder[f];

      let cmp = 0;
      if (field === "title") {
        cmp = getTitle(a).localeCompare(getTitle(b), undefined, { sensitivity: "base" });
      } else {
        cmp = getDate(a, field).localeCompare(getDate(b, field));
      }
      return direction === "asc" ? cmp : -cmp;
    });

    return items;
  }, [folderTree, workspaces, sortConfig, compare, searchQuery, queryLower, currentFolderId]);

  // All Items section: items at the current folder level
  const allItems = useMemo(() => {
    const items: MixedItem[] = [];

    if (currentFolderId === null) {
      // Root level: unstarred root folders + unstarred unfiled workspaces
      for (const node of currentLevelFolderNodes) {
        if (!node.folder.isFavorite) {
          if (!searchQuery || node.folder.name.toLowerCase().includes(queryLower)) {
            items.push({ kind: "folder", node });
          }
        }
      }

      for (const ws of workspaces) {
        if (!ws.isFavorite && !ws.folderId) {
          if (!searchQuery || (ws.title || "Untitled").toLowerCase().includes(queryLower)) {
            items.push({ kind: "workspace", workspace: ws });
          }
        }
      }
    } else {
      // Inside a folder: show direct child folders + workspaces in this folder
      for (const node of currentLevelFolderNodes) {
        if (!searchQuery || node.folder.name.toLowerCase().includes(queryLower)) {
          items.push({ kind: "folder", node });
        }
      }

      for (const ws of workspaces) {
        if (ws.folderId === currentFolderId) {
          if (!searchQuery || (ws.title || "Untitled").toLowerCase().includes(queryLower)) {
            items.push({ kind: "workspace", workspace: ws });
          }
        }
      }
    }

    // Sort: folders first, then by sortConfig
    items.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;

      if (a.kind === "workspace" && b.kind === "workspace") {
        return compare(a.workspace, b.workspace);
      }

      const { field, direction } = sortConfig;
      const getTitle = (item: MixedItem) =>
        item.kind === "workspace" ? item.workspace.title || "Untitled" : item.node.folder.name;
      const getDate = (item: MixedItem, f: "createdAt" | "updatedAt") =>
        item.kind === "workspace" ? item.workspace[f] : item.node.folder[f];

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
    workspaces,
    sortConfig,
    compare,
    searchQuery,
    queryLower,
  ]);

  // Compute orderedIds and itemTypes for SelectionProvider
  const { orderedIds, itemTypes } = useMemo(() => {
    const ids: string[] = [];
    const types = new Map<string, DragItemType>();
    const addItem = (item: MixedItem) => {
      if (item.kind === "workspace") {
        ids.push(item.workspace.workspaceId);
        types.set(item.workspace.workspaceId, "workspace");
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
    workspaces,
    folders,
    viewMode: viewMode as "grid" | "list",
    renamingFolderId,
    creatingSubfolderId,
    onSetRenamingFolder: setRenamingFolderId,
    onSetCreatingSubfolder: setCreatingSubfolderId,
    onRenameFolder,
    onDeleteFolder: setDeleteFolderTarget,
    onCreateFolder: handleCreateFolder,
    onOpenWorkspace: handleOpen,
    onRenameWorkspace: setRenameTarget,
    onDuplicateWorkspace: handleDuplicate,
    onDeleteWorkspace: setDeleteTarget,
    onToggleFavorite,
    onToggleFolderFavorite,
    onMoveToFolder: handleMoveToFolder,
    onMoveFolder,
    onNavigateToFolder: handleNavigateToFolder,
    ownerName,
    ownerAvatarUrl,
  };

  const renderItem = (item: MixedItem) => {
    if (item.kind === "workspace") {
      const ws = item.workspace;
      return viewMode === "grid" ? (
        <WorkspaceCard
          key={ws.workspaceId}
          workspace={ws}
          onOpen={() => handleOpen(ws.workspaceId)}
          onRename={() => setRenameTarget(ws)}
          onDuplicate={() => handleDuplicate(ws.workspaceId)}
          onDelete={() => setDeleteTarget(ws)}
          onToggleFavorite={onToggleFavorite}
          folders={folders}
          onMoveToFolder={handleMoveToFolder}
          ownerName={ownerName}
          ownerAvatarUrl={ownerAvatarUrl}
        />
      ) : (
        <WorkspaceListItem
          key={ws.workspaceId}
          workspace={ws}
          onOpen={() => handleOpen(ws.workspaceId)}
          onRename={() => setRenameTarget(ws)}
          onDuplicate={() => handleDuplicate(ws.workspaceId)}
          onDelete={() => setDeleteTarget(ws)}
          onToggleFavorite={onToggleFavorite}
          folders={folders}
          onMoveToFolder={handleMoveToFolder}
          ownerName={ownerName}
          ownerAvatarUrl={ownerAvatarUrl}
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
        <WorkspaceGridInner>
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">My Workspaces</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workspaces..."
                  data-testid="hubSearchInput"
                  className="h-8 w-48 rounded-md border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="flex items-center border border-border rounded-md">
                <button
                  onClick={() => toggleView("grid")}
                  className={`p-1.5 rounded-l-md transition-colors ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                  data-testid="gridViewButton"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => toggleView("list")}
                  className={`p-1.5 rounded-r-md transition-colors ${viewMode === "list" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                  data-testid="listViewButton"
                >
                  <List size={16} />
                </button>
              </div>
              <Button
                onClick={() => setCreatingFolder(true)}
                size="sm"
                variant="outline"
                data-testid="newFolderButton"
              >
                <FolderPlus size={16} />
                New Folder
              </Button>
              <Button
                onClick={() => onNew(currentFolderId)}
                size="sm"
                data-testid="newWorkspaceButton"
              >
                <Plus size={16} />
                New Workspace
              </Button>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : workspaces.length === 0 && folders.length === 0 ? (
            <div
              className="flex flex-col items-center py-16 px-4"
              data-testid="emptyStateOnboarding"
            >
              <h2 className="text-2xl font-bold mb-2">Welcome to Referencer</h2>
              <p className="text-muted-foreground text-center max-w-md mb-8">
                A collaborative workspace for close reading. Annotate, highlight, and connect
                passages side by side.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-lg mb-8">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-sm font-medium">Add passages</span>
                  <span className="text-xs text-muted-foreground">
                    Import or paste texts to study side by side
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <Highlighter size={20} />
                  </div>
                  <span className="text-sm font-medium">Highlight & underline</span>
                  <span className="text-xs text-muted-foreground">
                    Mark key phrases with colored layers
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-sm font-medium">Comment & discuss</span>
                  <span className="text-xs text-muted-foreground">
                    Add notes, replies, and reactions
                  </span>
                </div>
              </div>
              <Button onClick={() => onNew(null)} size="lg">
                <Plus size={16} />
                Create your first workspace
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

              {/* Starred section — only at root level */}
              {currentFolderId === null && (
                <section data-testid="starredSection">
                  <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3">
                    <Star size={14} fill="currentColor" className="text-yellow-500" />
                    Starred
                  </h3>
                  {starredItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground/60 px-1">
                      Star an item to pin it here
                    </p>
                  ) : viewMode === "grid" ? (
                    <div data-testid="starredGrid" className="space-y-4">
                      {starredItems.some((i) => i.kind === "folder") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {starredItems.filter((i) => i.kind === "folder").map(renderItem)}
                        </div>
                      )}
                      {starredItems.some((i) => i.kind === "workspace") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {starredItems.filter((i) => i.kind === "workspace").map(renderItem)}
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
                      {allItems.some((i) => i.kind === "workspace") && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {allItems.filter((i) => i.kind === "workspace").map(renderItem)}
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
                          Name{" "}
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
                          Created{" "}
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
                          Modified{" "}
                          {sortConfig.field === "updatedAt" &&
                            (sortConfig.direction === "asc" ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            ))}
                        </button>
                        <div className="w-[140px] shrink-0">Owner</div>
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
              if (renameTarget) onRename(renameTarget.workspaceId, title);
              setRenameTarget(null);
            }}
          />
          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            workspaceTitle={deleteTarget?.title || "Untitled"}
            onDelete={() => {
              if (deleteTarget) onDelete(deleteTarget.workspaceId);
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
        </WorkspaceGridInner>
      </SelectionProvider>
    </DndProvider>
  );
}

/** Inner wrapper to access useSelection for deselection handlers */
function WorkspaceGridInner({ children }: { children: React.ReactNode }) {
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
