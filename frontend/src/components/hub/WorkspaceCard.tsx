import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, ExternalLink, Pencil, Copy, Trash2, Star } from "lucide-react";
import { formatRelativeTime } from "@/lib/annotation/format-relative-time";
import { useDraggable } from "@/hooks/ui/use-hub-dnd";
import { useDndContext } from "@/contexts/DndContext";
import { useSelection } from "@/contexts/SelectionContext";
import { useClickHandler } from "@/hooks/ui/use-click-handler";
import type { WorkspaceItem } from "@/lib/workspace-client";
import type { FolderItem } from "@/lib/folder-client";
import { MoveToFolderMenu } from "./MoveToFolderMenu";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { OwnerAvatar } from "./OwnerAvatar";

interface WorkspaceCardProps {
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

export function WorkspaceCard({
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
}: WorkspaceCardProps) {
  const { t } = useTranslation("management");
  const { isSelected, isSelectionActive, handleItemClick, clearSelection, getSelectedItems } =
    useSelection();
  const selected = isSelected(workspace.workspaceId);
  const dragRef = useDraggable("workspace", workspace.workspaceId, {
    isSelected: selected,
    getSelectedItems,
    onClearSelection: clearSelection,
  });
  const { dragId } = useDndContext();
  const isDragging = dragId === workspace.workspaceId;

  const onSelect = useCallback(
    (e: React.MouseEvent) => {
      handleItemClick(workspace.workspaceId, e);
    },
    [handleItemClick, workspace.workspaceId],
  );

  const handleCardClick = useClickHandler(onSelect, onOpen);

  return (
    <div
      ref={dragRef}
      role="button"
      tabIndex={0}
      data-selectable
      className={`group relative flex flex-col p-4 rounded-lg border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer ${isDragging ? "opacity-50" : ""} ${selected ? "ring-2 ring-primary bg-primary/5 border-primary/30" : "border-border"}`}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      data-testid={`workspaceCard-${workspace.workspaceId}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <SelectionCheckbox
            checked={selected}
            visible={isSelectionActive}
            onClick={(e) => {
              e.stopPropagation();
              // Checkbox click: toggle (like Ctrl+Click), or range if Shift held
              handleItemClick(workspace.workspaceId, {
                ctrlKey: !e.shiftKey,
                metaKey: false,
                shiftKey: e.shiftKey,
              });
            }}
          />
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
          <h3 className="font-medium text-sm truncate">{workspace.title || t("hub.untitled")}</h3>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 hover:bg-accent transition-all shrink-0"
              data-testid="workspaceCardMenu"
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
                <ExternalLink size={14} /> {t("hub.open")}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onRename}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Pencil size={14} /> {t("hub.rename")}
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onDuplicate}
                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Copy size={14} /> {t("hub.duplicate")}
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
                <Trash2 size={14} /> {t("hub.delete")}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Modified {formatRelativeTime(workspace.updatedAt)} · Created{" "}
        {formatRelativeTime(workspace.createdAt)}
      </p>
      {ownerName && (
        <div className="flex items-center gap-1.5 mt-2">
          <OwnerAvatar name={ownerName} avatarUrl={ownerAvatarUrl} />
          <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
        </div>
      )}
    </div>
  );
}
