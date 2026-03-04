import { useCallback } from "react";
import { Folder, Star } from "lucide-react";
import { useDndContext } from "@/contexts/DndContext";
import { useDraggable, useDropTarget, type DragData } from "@/hooks/ui/use-hub-dnd";
import { getWorkspacesForFolder, canMoveFolderTo } from "@/lib/folder-tree";
import type { FolderNode } from "@/lib/folder-tree";
import type { WorkspaceItem } from "@/lib/workspace-client";
import type { FolderItem } from "@/lib/folder-client";
import { InlineNameInput } from "./InlineNameInput";
import { FolderDropdownMenu } from "./FolderDropdownMenu";

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
  onNavigateToFolder: (folderId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
}

export function FolderCard({
  node,
  workspaces,
  folders,
  renamingFolderId,
  onSetRenamingFolder,
  onSetCreatingSubfolder,
  onRenameFolder,
  onDeleteFolder,
  onToggleFolderFavorite,
  onMoveToFolder,
  onMoveFolder,
  onNavigateToFolder,
}: FolderCardProps) {
  const { dragId, overTargetId } = useDndContext();
  const folderWorkspaces = getWorkspacesForFolder(workspaces, node.folder.id);
  const isRenaming = renamingFolderId === node.folder.id;

  const dragRef = useDraggable("folder", node.folder.id);

  const handleDrop = useCallback(
    (data: DragData) => {
      if (data.type === "workspace") {
        const ws = workspaces.find((w) => w.workspaceId === data.id);
        if (ws?.folderId === node.folder.id) return;
        onMoveToFolder(data.id, node.folder.id);
      } else if (data.type === "folder") {
        if (canMoveFolderTo(folders, data.id, node.folder.id)) {
          onMoveFolder(data.id, node.folder.id);
        }
      }
    },
    [workspaces, folders, node.folder.id, onMoveToFolder, onMoveFolder],
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
    <div
      ref={combinedRef}
      data-testid={`folderCard-${node.folder.id}`}
      className={`group/folder relative flex flex-col justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer ${isDragging ? "opacity-50" : ""} ${isOver ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onDoubleClick={() => onNavigateToFolder(node.folder.id)}
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
          <Folder size={14} className="text-muted-foreground shrink-0" />
          {isRenaming ? (
            <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
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
        </div>
        <div
          className="ml-auto"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <FolderDropdownMenu
            depth={node.depth}
            onRename={() => onSetRenamingFolder(node.folder.id)}
            onNewSubfolder={() => onSetCreatingSubfolder(node.folder.id)}
            onDelete={() => onDeleteFolder(node.folder)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>{folderWorkspaces.length} items</span>
        <span>&middot;</span>
        <span>{node.children.length} folders</span>
      </div>
    </div>
  );
}
