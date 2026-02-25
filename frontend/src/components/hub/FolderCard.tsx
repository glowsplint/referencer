import { useCallback } from "react";
import { Folder, ChevronRight, ChevronDown, Star } from "lucide-react";
import { useFolderCollapse } from "@/hooks/ui/use-folder-collapse";
import { useDndContext } from "@/contexts/DndContext";
import { useDraggable, useDropTarget, type DragData } from "@/hooks/ui/use-hub-dnd";
import { getWorkspacesForFolder, canMoveFolderTo } from "@/lib/folder-tree";
import type { FolderNode } from "@/lib/folder-tree";
import type { WorkspaceItem } from "@/lib/workspace-client";
import type { FolderItem } from "@/lib/folder-client";
import { InlineNameInput } from "./InlineNameInput";
import { FolderDropdownMenu } from "./FolderDropdownMenu";
import { FolderSection } from "./FolderSection";
import { WorkspaceCard } from "./WorkspaceCard";

interface FolderCardProps {
  node: FolderNode;
  workspaces: WorkspaceItem[];
  folders: FolderItem[];
  viewMode: "grid" | "list";
  renamingFolderId: string | null;
  creatingSubfolderId: string | null;
  onSetRenamingFolder: (id: string | null) => void;
  onSetCreatingSubfolder: (parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onOpenWorkspace: (id: string) => void;
  onRenameWorkspace: (ws: WorkspaceItem) => void;
  onDuplicateWorkspace: (sourceId: string) => void;
  onDeleteWorkspace: (ws: WorkspaceItem) => void;
  onToggleFavorite: (workspaceId: string, isFavorite: boolean) => void;
  onToggleFolderFavorite: (folderId: string, isFavorite: boolean) => void;
  onMoveToFolder: (workspaceId: string, folderId: string | null) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
}

export function FolderCard({
  node,
  workspaces,
  folders,
  viewMode,
  renamingFolderId,
  creatingSubfolderId,
  onSetRenamingFolder,
  onSetCreatingSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  onOpenWorkspace,
  onRenameWorkspace,
  onDuplicateWorkspace,
  onDeleteWorkspace,
  onToggleFavorite,
  onToggleFolderFavorite,
  onMoveToFolder,
  onMoveFolder,
  ownerName,
  ownerAvatarUrl,
}: FolderCardProps) {
  const { isCollapsed, toggleCollapsed } = useFolderCollapse(node.folder.id);
  const { dragId, overTargetId } = useDndContext();
  const folderWorkspaces = getWorkspacesForFolder(workspaces, node.folder.id);
  const isRenaming = renamingFolderId === node.folder.id;
  const isCreatingSubfolder = creatingSubfolderId === node.folder.id;

  const dragRef = useDraggable("folder", node.folder.id);

  const handleDrop = useCallback(
    (data: DragData) => {
      if (data.type === "workspace") {
        onMoveToFolder(data.id, node.folder.id);
      } else if (data.type === "folder") {
        if (canMoveFolderTo(folders, data.id, node.folder.id)) {
          onMoveFolder(data.id, node.folder.id);
        }
      }
    },
    [folders, node.folder.id, onMoveToFolder, onMoveFolder],
  );

  const handleCanDrop = useCallback(
    (data: DragData) => {
      if (data.id === node.folder.id) return false;
      if (data.type === "folder") {
        return canMoveFolderTo(folders, data.id, node.folder.id);
      }
      return true;
    },
    [folders, node.folder.id],
  );

  const dropRef = useDropTarget(node.folder.id, handleDrop, handleCanDrop);

  const combinedRef = useCallback(
    (el: HTMLDivElement | null) => {
      (dragRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      (dropRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    [dragRef, dropRef],
  );

  const isDragging = dragId === node.folder.id;
  const isOver = overTargetId === node.folder.id;

  return (
    <div data-testid={`folderCard-${node.folder.id}`}>
      <div
        ref={combinedRef}
        className={`group/folder relative flex flex-col p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer ${isDragging ? "opacity-50" : ""} ${isOver ? "ring-2 ring-primary bg-primary/5" : ""}`}
        onClick={toggleCollapsed}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFolderFavorite(node.folder.id, !node.folder.isFavorite);
              }}
              className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
              data-testid="folderFavoriteToggle"
            >
              <Star
                size={14}
                fill={node.folder.isFavorite ? "currentColor" : "none"}
                className={node.folder.isFavorite ? "text-yellow-500" : "text-muted-foreground"}
              />
            </button>
            <button className="p-0.5 shrink-0">
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <Folder size={14} className="text-muted-foreground shrink-0" />
            {isRenaming ? (
              <div onClick={(e) => e.stopPropagation()}>
                <InlineNameInput
                  defaultValue={node.folder.name}
                  onSave={(name) => {
                    onRenameFolder(node.folder.id, name);
                    onSetRenamingFolder(null);
                  }}
                  onCancel={() => onSetRenamingFolder(null)}
                />
              </div>
            ) : (
              <span className="font-medium text-sm truncate">{node.folder.name}</span>
            )}
            <span className="text-xs text-muted-foreground ml-1 shrink-0">
              {folderWorkspaces.length}
            </span>
          </div>
          <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
            <FolderDropdownMenu
              depth={node.depth}
              onRename={() => onSetRenamingFolder(node.folder.id)}
              onNewSubfolder={() => onSetCreatingSubfolder(node.folder.id)}
              onDelete={() => onDeleteFolder(node.folder)}
            />
          </div>
        </div>
      </div>

      {/* Expanded children */}
      {!isCollapsed && (
        <div className="mt-2 ml-4">
          {isCreatingSubfolder && (
            <div className="flex items-center gap-1.5 py-2 px-1 mb-2">
              <Folder size={14} className="text-muted-foreground shrink-0" />
              <InlineNameInput
                onSave={(name) => {
                  onCreateFolder(node.folder.id, name);
                  onSetCreatingSubfolder(null);
                }}
                onCancel={() => onSetCreatingSubfolder(null)}
              />
            </div>
          )}

          {node.children.map((child) => (
            <FolderSection
              key={child.folder.id}
              node={child}
              workspaces={workspaces}
              folders={folders}
              viewMode={viewMode}
              renamingFolderId={renamingFolderId}
              creatingSubfolderId={creatingSubfolderId}
              onSetRenamingFolder={onSetRenamingFolder}
              onSetCreatingSubfolder={onSetCreatingSubfolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFolder={onCreateFolder}
              onOpenWorkspace={onOpenWorkspace}
              onRenameWorkspace={onRenameWorkspace}
              onDuplicateWorkspace={onDuplicateWorkspace}
              onDeleteWorkspace={onDeleteWorkspace}
              onToggleFavorite={onToggleFavorite}
              onToggleFolderFavorite={onToggleFolderFavorite}
              onMoveToFolder={onMoveToFolder}
              onMoveFolder={onMoveFolder}
              ownerName={ownerName}
              ownerAvatarUrl={ownerAvatarUrl}
            />
          ))}

          {folderWorkspaces.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
              {folderWorkspaces.map((ws) => (
                <WorkspaceCard
                  key={ws.workspaceId}
                  workspace={ws}
                  onOpen={() => onOpenWorkspace(ws.workspaceId)}
                  onRename={() => onRenameWorkspace(ws)}
                  onDuplicate={() => onDuplicateWorkspace(ws.workspaceId)}
                  onDelete={() => onDeleteWorkspace(ws)}
                  onToggleFavorite={onToggleFavorite}
                  folders={folders}
                  onMoveToFolder={onMoveToFolder}
                  ownerName={ownerName}
                  ownerAvatarUrl={ownerAvatarUrl}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
