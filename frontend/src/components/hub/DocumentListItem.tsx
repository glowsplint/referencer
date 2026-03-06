import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, ExternalLink, Pencil, Copy, Trash2, Star } from "lucide-react";
import { formatRelativeTime } from "@/lib/annotation/format-relative-time";
import { useDraggable } from "@/hooks/ui/use-hub-dnd";
import { useDndContext } from "@/contexts/DndContext";
import { useSelection } from "@/contexts/SelectionContext";
import { useClickHandler } from "@/hooks/ui/use-click-handler";
import type { DocumentItem } from "@/lib/document-client";
import type { FolderItem } from "@/lib/folder-client";
import { MoveToFolderMenu } from "./MoveToFolderMenu";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { OwnerAvatar } from "./OwnerAvatar";

interface DocumentListItemProps {
  document: DocumentItem;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleFavorite?: (documentId: string, isFavorite: boolean) => void;
  folders?: FolderItem[];
  onMoveToFolder?: (documentId: string, folderId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
}

export function DocumentListItem({
  document,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  folders,
  onMoveToFolder,
  ownerName,
  ownerAvatarUrl,
}: DocumentListItemProps) {
  const { t } = useTranslation("management");
  const { isSelected, isSelectionActive, handleItemClick, clearSelection, getSelectedItems } =
    useSelection();
  const selected = isSelected(document.documentId);
  const dragRef = useDraggable("document", document.documentId, {
    isSelected: selected,
    getSelectedItems,
    onClearSelection: clearSelection,
  });
  const { dragId } = useDndContext();
  const isDragging = dragId === document.documentId;

  const onSelect = useCallback(
    (e: React.MouseEvent) => {
      handleItemClick(document.documentId, e);
    },
    [handleItemClick, document.documentId],
  );

  const handleRowClick = useClickHandler(onSelect, onOpen, isSelectionActive);

  return (
    <div
      ref={dragRef}
      role="button"
      tabIndex={0}
      data-selectable
      className={`group flex items-center px-4 py-3 rounded-md hover:bg-accent/50 transition-colors cursor-pointer ${isDragging ? "opacity-50" : ""} ${selected ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      data-testid={`documentListItem-${document.documentId}`}
    >
      <SelectionCheckbox
        checked={selected}
        visible={isSelectionActive}
        onClick={(e) => {
          e.stopPropagation();
          handleItemClick(document.documentId, {
            ctrlKey: !e.shiftKey,
            metaKey: false,
            shiftKey: e.shiftKey,
          });
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite?.(document.documentId, !document.isFavorite);
        }}
        className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
        data-testid="favoriteToggle"
      >
        <Star
          size={14}
          fill={document.isFavorite ? "currentColor" : "none"}
          className={document.isFavorite ? "text-yellow-500" : "text-muted-foreground"}
        />
      </button>
      <span className="font-medium text-sm truncate flex-1 ml-1">
        {document.title || t("hub.untitled")}
      </span>
      <span className="text-xs text-muted-foreground w-[120px] shrink-0">
        {formatRelativeTime(document.createdAt)}
      </span>
      <span className="text-xs text-muted-foreground w-[120px] shrink-0">
        {formatRelativeTime(document.updatedAt)}
      </span>
      <div className="flex items-center gap-1.5 w-[140px] shrink-0">
        <OwnerAvatar name={ownerName} avatarUrl={ownerAvatarUrl} />
        {ownerName && <span className="text-xs text-muted-foreground truncate">{ownerName}</span>}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 hover:bg-accent transition-all shrink-0"
            data-testid="documentListItemMenu"
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
                currentFolderId={document.folderId}
                onMove={(folderId) => onMoveToFolder(document.documentId, folderId)}
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
  );
}
