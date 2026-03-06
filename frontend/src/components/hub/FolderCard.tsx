import { useCallback } from "react";
import { Folder, Star } from "lucide-react";
import { useDndContext } from "@/contexts/DndContext";
import { useSelection } from "@/contexts/SelectionContext";
import { useClickHandler } from "@/hooks/ui/use-click-handler";
import { useDraggable, useDropTarget, type DragData } from "@/hooks/ui/use-hub-dnd";
import { getDocumentsForFolder, canMoveFolderTo } from "@/lib/folder-tree";
import type { FolderNode } from "@/lib/folder-tree";
import type { DocumentItem } from "@/lib/document-client";
import type { FolderItem } from "@/lib/folder-client";
import { InlineNameInput } from "./InlineNameInput";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { FolderDropdownMenu } from "./FolderDropdownMenu";

interface FolderCardProps {
  node: FolderNode;
  documents: DocumentItem[];
  folders: FolderItem[];
  viewMode: "grid" | "list";
  renamingFolderId: string | null;
  creatingSubfolderId: string | null;
  onSetRenamingFolder: (id: string | null) => void;
  onSetCreatingSubfolder: (parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (folder: FolderItem) => void;
  onCreateFolder: (parentId: string | null, name: string) => void;
  onOpenDocument: (id: string) => void;
  onRenameDocument: (ws: DocumentItem) => void;
  onDuplicateDocument: (sourceId: string) => void;
  onDeleteDocument: (ws: DocumentItem) => void;
  onToggleFavorite: (documentId: string, isFavorite: boolean) => void;
  onToggleFolderFavorite: (folderId: string, isFavorite: boolean) => void;
  onMoveToFolder: (documentId: string, folderId: string | null) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
  onNavigateToFolder: (folderId: string | null) => void;
  ownerName?: string;
  ownerAvatarUrl?: string;
}

export function FolderCard({
  node,
  documents,
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
  const { isSelected, isSelectionActive, handleItemClick, clearSelection, getSelectedItems } =
    useSelection();
  const selected = isSelected(node.folder.id);
  const folderDocuments = getDocumentsForFolder(documents, node.folder.id);
  const isRenaming = renamingFolderId === node.folder.id;

  const dragRef = useDraggable("folder", node.folder.id, {
    isSelected: selected,
    getSelectedItems,
    onClearSelection: clearSelection,
  });

  const onSelect = useCallback(
    (e: React.MouseEvent) => {
      handleItemClick(node.folder.id, e);
    },
    [handleItemClick, node.folder.id],
  );

  const handleCardClick = useClickHandler(
    onSelect,
    () => onNavigateToFolder(node.folder.id),
    isSelectionActive,
  );

  const handleDrop = useCallback(
    (data: DragData) => {
      const items = data.selectedItems ?? [{ type: data.type, id: data.id }];
      // Documents in parallel, folders sequentially
      const wsItems = items.filter((i) => i.type === "document");
      const folderItems = items.filter((i) => i.type === "folder");
      for (const item of wsItems) {
        const ws = documents.find((w) => w.documentId === item.id);
        if (ws?.folderId === node.folder.id) continue;
        onMoveToFolder(item.id, node.folder.id);
      }
      for (const item of folderItems) {
        if (canMoveFolderTo(folders, item.id, node.folder.id)) {
          onMoveFolder(item.id, node.folder.id);
        }
      }
    },
    [documents, folders, node.folder.id, onMoveToFolder, onMoveFolder],
  );

  const handleCanDrop = useCallback(
    (data: DragData) => {
      const items = data.selectedItems ?? [{ type: data.type, id: data.id }];
      return items.every((item) => {
        if (item.id === node.folder.id) return false;
        if (item.type === "folder") {
          return canMoveFolderTo(folders, item.id, node.folder.id);
        }
        return true;
      });
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
      data-selectable
      className={`group/folder relative flex flex-col justify-between p-4 rounded-lg border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer ${isDragging ? "opacity-50" : ""} ${isOver ? "ring-2 ring-primary bg-primary/5" : ""} ${selected && !isOver ? "ring-2 ring-primary bg-primary/5 border-primary/30" : "border-border"}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <SelectionCheckbox
            checked={selected}
            visible={isSelectionActive}
            onClick={(e) => {
              e.stopPropagation();
              handleItemClick(node.folder.id, {
                ctrlKey: !e.shiftKey,
                metaKey: false,
                shiftKey: e.shiftKey,
              });
            }}
          />
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
            onOpen={() => onNavigateToFolder(node.folder.id)}
            onRename={() => onSetRenamingFolder(node.folder.id)}
            onNewSubfolder={() => onSetCreatingSubfolder(node.folder.id)}
            onDelete={() => onDeleteFolder(node.folder)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <span>{folderDocuments.length} items</span>
        <span>&middot;</span>
        <span>{node.children.length} folders</span>
      </div>
    </div>
  );
}
