import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { useDropTarget, type DragData } from "@/hooks/ui/use-hub-dnd";
import { canMoveFolderTo, getFolderAncestorPath } from "@/lib/folder-tree";
import type { FolderItem } from "@/lib/folder-client";

interface FolderBreadcrumbProps {
  folders: FolderItem[];
  currentFolderId: string | null;
  onNavigate: (folderId: string | null) => void;
  onMoveToFolder: (workspaceId: string, folderId: string | null) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
}

function BreadcrumbDropSegment({
  label,
  folderId,
  folders,
  onNavigate,
  onMoveToFolder,
  onMoveFolder,
}: {
  label: string;
  folderId: string | null;
  folders: FolderItem[];
  onNavigate: (folderId: string | null) => void;
  onMoveToFolder: (workspaceId: string, folderId: string | null) => void;
  onMoveFolder: (folderId: string, parentId: string | null) => void;
}) {
  const handleDrop = useCallback(
    (data: DragData) => {
      const items = data.selectedItems ?? [{ type: data.type, id: data.id }];
      const wsItems = items.filter((i) => i.type === "workspace");
      const folderItems = items.filter((i) => i.type === "folder");
      for (const item of wsItems) {
        onMoveToFolder(item.id, folderId);
      }
      for (const item of folderItems) {
        if (folderId === null || canMoveFolderTo(folders, item.id, folderId)) {
          onMoveFolder(item.id, folderId);
        }
      }
    },
    [folderId, folders, onMoveToFolder, onMoveFolder],
  );

  const handleCanDrop = useCallback(
    (data: DragData) => {
      const items = data.selectedItems ?? [{ type: data.type, id: data.id }];
      return items.every((item) => {
        if (item.type === "folder") {
          if (item.id === folderId) return false;
          if (folderId === null) return true;
          return canMoveFolderTo(folders, item.id, folderId);
        }
        return true;
      });
    },
    [folderId, folders],
  );

  const dropRef = useDropTarget(folderId ?? "breadcrumb-root", handleDrop, handleCanDrop);

  return (
    <div ref={dropRef} className="inline-flex">
      <button
        onClick={() => onNavigate(folderId)}
        className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
        data-testid={`breadcrumb-${folderId ?? "root"}`}
      >
        {label}
      </button>
    </div>
  );
}

export function FolderBreadcrumb({
  folders,
  currentFolderId,
  onNavigate,
  onMoveToFolder,
  onMoveFolder,
}: FolderBreadcrumbProps) {
  const { t } = useTranslation("management");

  if (currentFolderId === null) return null;

  const ancestorPath = getFolderAncestorPath(folders, currentFolderId);

  return (
    <nav className="flex items-center gap-1 mb-4" data-testid="folderBreadcrumb">
      <BreadcrumbDropSegment
        label={t("hub.myWorkspaces")}
        folderId={null}
        folders={folders}
        onNavigate={onNavigate}
        onMoveToFolder={onMoveToFolder}
        onMoveFolder={onMoveFolder}
      />
      {ancestorPath.map((folder, index) => (
        <span key={folder.id} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-muted-foreground" />
          {index === ancestorPath.length - 1 ? (
            <span className="text-sm font-medium" data-testid={`breadcrumb-${folder.id}`}>
              {folder.name}
            </span>
          ) : (
            <BreadcrumbDropSegment
              label={folder.name}
              folderId={folder.id}
              folders={folders}
              onNavigate={onNavigate}
              onMoveToFolder={onMoveToFolder}
              onMoveFolder={onMoveFolder}
            />
          )}
        </span>
      ))}
    </nav>
  );
}
