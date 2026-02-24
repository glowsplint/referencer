import { useState } from "react";
import { LayoutGrid, List, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { useWorkspaceSort } from "@/hooks/data/use-workspace-sort";
import { WorkspaceCard } from "./WorkspaceCard";
import { WorkspaceListItem } from "./WorkspaceListItem";
import { RenameDialog } from "./RenameDialog";
import { DeleteDialog } from "./DeleteDialog";
import type { WorkspaceItem } from "@/lib/workspace-client";

type ViewMode = "grid" | "list";

interface WorkspaceGridProps {
  workspaces: WorkspaceItem[];
  isLoading: boolean;
  navigate: (hash: string) => void;
  onNew: () => void;
  onRename: (workspaceId: string, title: string) => Promise<void>;
  onDelete: (workspaceId: string) => Promise<void>;
  onDuplicate: (sourceId: string, newId: string) => Promise<void>;
  onToggleFavorite: (workspaceId: string, isFavorite: boolean) => Promise<void>;
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
  ownerName,
  ownerAvatarUrl,
}: WorkspaceGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.HUB_VIEW_MODE) as ViewMode) || "grid";
  });
  const [renameTarget, setRenameTarget] = useState<WorkspaceItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceItem | null>(null);
  const { sorted, sortConfig, setSort } = useWorkspaceSort(workspaces);

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(STORAGE_KEYS.HUB_VIEW_MODE, mode);
  };

  const handleOpen = (id: string) => navigate(`#/${id}`);

  const handleDuplicate = async (sourceId: string) => {
    const newId = crypto.randomUUID();
    await onDuplicate(sourceId, newId);
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
          <Button onClick={onNew} size="sm" data-testid="newWorkspaceButton">
            <Plus size={16} />
            New Workspace
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No workspaces yet</p>
          <Button onClick={onNew} variant="outline">
            <Plus size={16} />
            Create your first workspace
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          data-testid="workspaceGrid"
        >
          {sorted.map((ws) => (
            <WorkspaceCard
              key={ws.workspaceId}
              workspace={ws}
              onOpen={() => handleOpen(ws.workspaceId)}
              onRename={() => setRenameTarget(ws)}
              onDuplicate={() => handleDuplicate(ws.workspaceId)}
              onDelete={() => setDeleteTarget(ws)}
              onToggleFavorite={onToggleFavorite}
              ownerName={ownerName}
              ownerAvatarUrl={ownerAvatarUrl}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1" data-testid="workspaceList">
          <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border mb-1">
            <div className="w-8" /> {/* star column */}
            <button onClick={() => setSort("title")} className="flex items-center gap-1 flex-1" data-testid="sortByTitle">
              Name {sortConfig.field === "title" && (sortConfig.direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
            <button onClick={() => setSort("createdAt")} className="flex items-center gap-1 w-[120px] shrink-0" data-testid="sortByCreated">
              Created {sortConfig.field === "createdAt" && (sortConfig.direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
            <button onClick={() => setSort("updatedAt")} className="flex items-center gap-1 w-[120px] shrink-0" data-testid="sortByModified">
              Modified {sortConfig.field === "updatedAt" && (sortConfig.direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
            <div className="w-[140px] shrink-0">Owner</div>
            <div className="w-8" /> {/* menu column */}
          </div>
          {sorted.map((ws) => (
            <WorkspaceListItem
              key={ws.workspaceId}
              workspace={ws}
              onOpen={() => handleOpen(ws.workspaceId)}
              onRename={() => setRenameTarget(ws)}
              onDuplicate={() => handleDuplicate(ws.workspaceId)}
              onDelete={() => setDeleteTarget(ws)}
              onToggleFavorite={onToggleFavorite}
              ownerName={ownerName}
              ownerAvatarUrl={ownerAvatarUrl}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <RenameDialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
        currentTitle={renameTarget?.title ?? ""}
        onRename={async (title) => {
          if (renameTarget) await onRename(renameTarget.workspaceId, title);
          setRenameTarget(null);
        }}
      />
      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        workspaceTitle={deleteTarget?.title || "Untitled"}
        onDelete={async () => {
          if (deleteTarget) await onDelete(deleteTarget.workspaceId);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
