import { useState } from "react";
import {
  LayoutGrid,
  List,
  Plus,
  FolderPlus,
  ChevronUp,
  ChevronDown,
  Star,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useWorkspaceSort } from "@/hooks/data/use-workspace-sort";
import { buildFolderTree } from "@/lib/folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import { WorkspaceCard } from "./WorkspaceCard";
import { WorkspaceListItem } from "./WorkspaceListItem";
import { RenameDialog } from "./RenameDialog";
import { DeleteDialog } from "./DeleteDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { FolderSection } from "./FolderSection";
import { InlineNameInput } from "./InlineNameInput";
import type { WorkspaceItem } from "@/lib/workspace-client";

type ViewMode = "grid" | "list";

interface WorkspaceGridProps {
  workspaces: WorkspaceItem[];
  isLoading: boolean;
  navigate: (hash: string) => void;
  onNew: () => void;
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
  ownerName,
  ownerAvatarUrl,
}: WorkspaceGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.HUB_VIEW_MODE) as ViewMode) || "grid";
  });
  const [renameTarget, setRenameTarget] = useState<WorkspaceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [creatingSubfolderId, setCreatingSubfolderId] = useState<string | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderItem | null>(null);
  const { favorites, others, sortConfig, setSort } = useWorkspaceSort(workspaces);

  const folderTree = buildFolderTree(folders);

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEYS.HUB_VIEW_MODE, mode);
  };

  const handleOpen = (id: string) => navigate(`#/${id}`);

  const handleDuplicate = (sourceId: string) => {
    const newId = crypto.randomUUID();
    onDuplicate(sourceId, newId);
  };

  const handleCreateFolder = (parentId: string | null, name: string) => {
    const id = crypto.randomUUID();
    onCreateFolder(id, parentId, name);
  };

  const handleMoveToFolder = (workspaceId: string, folderId: string | null) => {
    if (folderId) {
      onMoveWorkspaceToFolder(workspaceId, folderId);
    } else {
      onUnfileWorkspace(workspaceId);
    }
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">My Workspaces</h2>
        <div className="flex items-center gap-2">
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
          <Button onClick={onNew} size="sm" data-testid="newWorkspaceButton">
            <Plus size={16} />
            New Workspace
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : workspaces.length === 0 && folders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No workspaces yet</p>
          <Button onClick={onNew} variant="outline">
            <Plus size={16} />
            Create your first workspace
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Favorites section */}
          <section data-testid="favoritesSection">
            <h3 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mb-3">
              <Star size={14} fill="currentColor" className="text-yellow-500" />
              Favorites
            </h3>
            {favorites.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 px-1">
                Star a workspace to pin it here
              </p>
            ) : viewMode === "grid" ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                data-testid="workspaceGrid"
              >
                {favorites.map((ws) => (
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
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {favorites.map((ws) => (
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
                ))}
              </div>
            )}
          </section>

          {/* Divider */}
          <hr className="border-border" />

          {/* Folders section */}
          {(folderTree.length > 0 || creatingFolder) && (
            <section data-testid="foldersSection">
              {/* Inline input for new root folder */}
              {creatingFolder && (
                <div className="flex items-center gap-1.5 py-2 px-1 mb-2">
                  <Folder size={14} className="text-muted-foreground shrink-0" />
                  <InlineNameInput
                    onSave={(name) => {
                      handleCreateFolder(null, name);
                      setCreatingFolder(false);
                    }}
                    onCancel={() => setCreatingFolder(false)}
                  />
                </div>
              )}

              {folderTree.map((node) => (
                <FolderSection
                  key={node.folder.id}
                  node={node}
                  workspaces={workspaces}
                  folders={folders}
                  viewMode={viewMode}
                  renamingFolderId={renamingFolderId}
                  creatingSubfolderId={creatingSubfolderId}
                  onSetRenamingFolder={setRenamingFolderId}
                  onSetCreatingSubfolder={setCreatingSubfolderId}
                  onRenameFolder={onRenameFolder}
                  onDeleteFolder={setDeleteFolderTarget}
                  onCreateFolder={handleCreateFolder}
                  onOpenWorkspace={handleOpen}
                  onRenameWorkspace={setRenameTarget}
                  onDuplicateWorkspace={handleDuplicate}
                  onDeleteWorkspace={setDeleteTarget}
                  onToggleFavorite={onToggleFavorite}
                  onMoveToFolder={handleMoveToFolder}
                  ownerName={ownerName}
                  ownerAvatarUrl={ownerAvatarUrl}
                />
              ))}
            </section>
          )}

          {/* Unfiled workspaces section */}
          {others.length > 0 && (
            <section data-testid="workspacesSection">
              {viewMode === "grid" ? (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                  data-testid="workspaceGrid"
                >
                  {others.map((ws) => (
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
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1" data-testid="workspaceList">
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
                  {others.map((ws) => (
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
                  ))}
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
    </div>
  );
}
