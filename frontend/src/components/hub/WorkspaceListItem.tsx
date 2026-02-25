import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, ExternalLink, Pencil, Copy, Trash2, Star } from "lucide-react";
import { formatRelativeTime } from "@/lib/annotation/format-relative-time";
import { useDraggable } from "@/hooks/ui/use-hub-dnd";
import { useDndContext } from "@/contexts/DndContext";
import type { WorkspaceItem } from "@/lib/workspace-client";
import type { FolderItem } from "@/lib/folder-client";
import { MoveToFolderMenu } from "./MoveToFolderMenu";

interface WorkspaceListItemProps {
  workspace: WorkspaceItem;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite?: (workspaceId: string, isFavorite: boolean) => void;
  folders?: FolderItem[];
  onMoveToFolder?: (workspaceId: string, folderId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
}

export function WorkspaceListItem({
  workspace,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  folders,
  onMoveToFolder,
  ownerName,
  ownerAvatarUrl,
}: WorkspaceListItemProps) {
  const dragRef = useDraggable("workspace", workspace.workspaceId);
  const { dragId } = useDndContext();
  const isDragging = dragId === workspace.workspaceId;

  return (
    <div
      ref={dragRef}
      className={`group flex items-center px-4 py-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${isDragging ? "opacity-50" : ""}`}
      onClick={onOpen}
      data-testid={`workspaceListItem-${workspace.workspaceId}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(workspace.workspaceId, !workspace.isFavorite);
        }}
        className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
        data-testid="favoriteToggle"
      >
        <Star
          size={14}
          fill={workspace.isFavorite ? "currentColor" : "none"}
          className={workspace.isFavorite ? "text-yellow-500" : "text-muted-foreground"}
        />
      </button>
      <span className="font-medium text-sm truncate flex-1 ml-1">
        {workspace.title || "Untitled"}
      </span>
      <span className="text-xs text-muted-foreground w-[120px] shrink-0">
        {formatRelativeTime(workspace.createdAt)}
      </span>
      <span className="text-xs text-muted-foreground w-[120px] shrink-0">
        {formatRelativeTime(workspace.updatedAt)}
      </span>
      <div className="flex items-center gap-1.5 w-[140px] shrink-0">
        {ownerAvatarUrl ? (
          <img src={ownerAvatarUrl} alt="" className="w-5 h-5 rounded-full" />
        ) : ownerName ? (
          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium">
            {ownerName[0]}
          </div>
        ) : null}
        {ownerName && <span className="text-xs text-muted-foreground truncate">{ownerName}</span>}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0"
            data-testid="workspaceListItemMenu"
          >
            <MoreHorizontal size={14} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={4}
            className="z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu.Item
              onSelect={onOpen}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ExternalLink size={14} /> Open
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={onRename}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Pencil size={14} /> Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={onDuplicate}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Copy size={14} /> Duplicate
            </DropdownMenu.Item>
            {folders && onMoveToFolder && (
              <MoveToFolderMenu
                folders={folders}
                currentFolderId={workspace.folderId}
                onMove={(folderId) => onMoveToFolder(workspace.workspaceId, folderId)}
              />
            )}
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              onSelect={onDelete}
              className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
