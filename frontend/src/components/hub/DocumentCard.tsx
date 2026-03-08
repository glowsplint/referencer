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
import { TagMenu } from "./TagMenu";
import { OwnerAvatar } from "./OwnerAvatar";

interface DocumentCardProps {
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
  tags?: string[];
  allTags?: string[];
  onAddTag?: (documentId: string, tag: string) => void;
  onRemoveTag?: (documentId: string, tag: string) => void;
}

export function DocumentCard({
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
  tags = [],
  allTags = [],
  onAddTag,
  onRemoveTag,
}: DocumentCardProps) {
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

  const handleCardClick = useClickHandler(onSelect, onOpen, isSelectionActive);

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
      data-testid={`documentCard-${document.documentId}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
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
          <h3 className="font-medium text-sm truncate">{document.title || t("hub.untitled")}</h3>
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 hover:bg-accent transition-all shrink-0"
              data-testid="documentCardMenu"
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
              {onAddTag && onRemoveTag && (
                <TagMenu
                  documentId={document.documentId}
                  currentTags={tags}
                  allTags={allTags}
                  onAddTag={onAddTag}
                  onRemoveTag={onRemoveTag}
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
        Modified {formatRelativeTime(document.updatedAt)} · Created{" "}
        {formatRelativeTime(document.createdAt)}
      </p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2" data-testid="documentCardTags">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-muted text-[10px]"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      )}
      {ownerName && (
        <div className="flex items-center gap-1.5 mt-2">
          <OwnerAvatar name={ownerName} avatarUrl={ownerAvatarUrl} />
          <span className="text-xs text-muted-foreground truncate">{ownerName}</span>
        </div>
      )}
    </div>
  );
}
