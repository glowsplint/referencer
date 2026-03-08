import { useCallback } from "react";
import { Folder, Star } from "lucide-react";
import { useDndContext } from "@/contexts/DndContext";
import { useSelection } from "@/contexts/SelectionContext";
import { useDraggable, useDropTarget, type DragData } from "@/hooks/ui/use-hub-dnd";
import { getDocumentsForFolder, canMoveFolderTo } from "@/lib/folder-tree";
import type { FolderNode } from "@/lib/folder-tree";
import type { DocumentItem } from "@/lib/document-client";
import type { FolderItem } from "@/lib/folder-client";
import { InlineNameInput } from "./InlineNameInput";
import { SelectionCheckbox } from "./SelectionCheckbox";
import { FolderDropdownMenu } from "./FolderDropdownMenu";

interface FolderListItemProps {
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

export function FolderListItem({
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
}: FolderListItemProps) {
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

  const handleRowClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || isSelectionActive) {
        handleItemClick(node.folder.id, e);
        return;
      }
      onNavigateToFolder(node.folder.id);
    },
    [handleItemClick, node.folder.id, isSelectionActive, onNavigateToFolder],
  );

  const handleDrop = useCallback(
    (data: DragData) => {
      const items = data.selectedItems ?? [{ type: data.type, id: data.id }];
      const wsItems = items.filter((i) => i.type === "document");
      const folderItems = items.filter((i) => i.type === "folder");
      for (const item of wsItems) {
        onMoveToFolder(item.id, node.folder.id);
      }
      for (const item of folderItems) {
        if (canMoveFolderTo(folders, item.id, node.folder.id)) {
          onMoveFolder(item.id, node.folder.id);
        }
      }
    },
    [folders, node.folder.id, onMoveToFolder, onMoveFolder],
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
      data-testid={`folderListItem-${node.folder.id}`}
      data-selectable
      className={`group/folder flex items-center px-4 py-3 rounded-md hover:bg-accent/30 transition-colors cursor-pointer ${isDragging ? "opacity-50" : ""} ${isOver ? "ring-2 ring-primary bg-primary/5" : ""} ${selected && !isOver ? "ring-2 ring-primary bg-primary/5" : ""}`}
      onClick={handleRowClick}
    >
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
      <Folder size={14} className="text-muted-foreground shrink-0 ml-1" />
      {isRenaming ? (
        <div
          className="flex-1 ml-1.5"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
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
        <span className="font-medium text-sm truncate flex-1 ml-1.5">
          {node.folder.name}
          <span className="text-xs text-muted-foreground font-normal ml-2">
            {folderDocuments.length} items
          </span>
        </span>
      )}
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <FolderDropdownMenu
          depth={node.depth}
          onOpen={() => onNavigateToFolder(node.folder.id)}
          onRename={() => onSetRenamingFolder(node.folder.id)}
          onNewSubfolder={() => onSetCreatingSubfolder(node.folder.id)}
          onDelete={() => onDeleteFolder(node.folder)}
        />
      </div>
    </div>
  );
}
