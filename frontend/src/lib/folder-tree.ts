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

/** Returns all descendant folder IDs (children, grandchildren, etc.) */
export function getAllDescendantFolderIds(folders: FolderItem[], folderId: string): string[] {
  const result: string[] = [];
  const stack = [folderId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const children = folders.filter((f) => f.parentId === current);
    for (const child of children) {
      result.push(child.id);
      stack.push(child.id);
    }
  }
  return result;
}

/** Returns the maximum depth of the subtree below a given folder (0 if no children) */
export function getSubtreeDepth(folders: FolderItem[], folderId: string): number {
  const children = folders.filter((f) => f.parentId === folderId);
  if (children.length === 0) return 0;
  return 1 + Math.max(...children.map((c) => getSubtreeDepth(folders, c.id)));
}

/** Validates whether a folder can be moved to a new parent */
export function canMoveFolderTo(
  folders: FolderItem[],
  folderId: string,
  targetParentId: string | null,
): boolean {
  // Can't move to self
  if (targetParentId === folderId) return false;
  // Moving to root is always valid (depth check not needed for root)
  if (targetParentId === null) return true;
  // Can't move to own descendant (would create cycle)
  const descendants = getAllDescendantFolderIds(folders, folderId);
  if (descendants.includes(targetParentId)) return false;
  // Check depth constraint: parent's depth + subtree depth of moved folder + 1 <= MAX_DEPTH (3)
  const parentDepth = getFolderDepth(folders, targetParentId);
  const subtreeDepth = getSubtreeDepth(folders, folderId);
  return parentDepth + 1 + subtreeDepth <= 3;
}
