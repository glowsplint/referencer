import type { FolderItem } from "@/lib/folder-client";
import type { WorkspaceItem } from "@/lib/workspace-client";

export interface FolderNode {
  folder: FolderItem;
  children: FolderNode[];
  depth: number;
}

function buildSubtree(folders: FolderItem[], parentId: string | null, depth: number): FolderNode[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    .map((folder) => ({
      folder,
      children: buildSubtree(folders, folder.id, depth + 1),
      depth,
    }));
}

export function buildFolderTree(folders: FolderItem[]): FolderNode[] {
  return buildSubtree(folders, null, 0);
}

export function getFolderDepth(folders: FolderItem[], folderId: string): number {
  let depth = 0;
  let currentId: string | null = folderId;
  while (currentId) {
    const folder = folders.find((f) => f.id === currentId);
    if (!folder || !folder.parentId) break;
    depth++;
    currentId = folder.parentId;
  }
  return depth;
}

export function getWorkspacesForFolder(
  workspaces: WorkspaceItem[],
  folderId: string,
): WorkspaceItem[] {
  return workspaces.filter((ws) => ws.folderId === folderId);
}

export function getUnfiledWorkspaces(workspaces: WorkspaceItem[]): WorkspaceItem[] {
  return workspaces.filter((ws) => !ws.folderId && !ws.isFavorite);
}
