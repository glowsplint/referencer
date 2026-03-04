import { useCallback } from "react";
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
      if (data.type === "workspace") {
        onMoveToFolder(data.id, folderId);
      } else if (data.type === "folder") {
        if (folderId === null || canMoveFolderTo(folders, data.id, folderId)) {
          onMoveFolder(data.id, folderId);
        }
      }
    },
    [folderId, folders, onMoveToFolder, onMoveFolder],
  );

  const handleCanDrop = useCallback(
    (data: DragData) => {
      if (data.type === "folder") {
        if (data.id === folderId) return false;
        if (folderId === null) return true;
        return canMoveFolderTo(folders, data.id, folderId);
      }
      return true;
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
  if (currentFolderId === null) return null;

  const ancestorPath = getFolderAncestorPath(folders, currentFolderId);

  return (
    <nav className="flex items-center gap-1 mb-4" data-testid="folderBreadcrumb">
      <BreadcrumbDropSegment
        label="My Workspaces"
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
