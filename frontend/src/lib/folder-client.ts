import { apiFetch, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export interface FolderItem {
  id: string;
  parentId: string | null;
  name: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchFolders(): Promise<FolderItem[]> {
  return apiFetch<FolderItem[]>("/api/folders");
}

export async function createFolder(
  id: string,
  parentId: string | null,
  name: string,
): Promise<void> {
  await apiPost("/api/folders", { id, parentId, name });
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await apiPatch(`/api/folders/${id}`, { name });
}

export async function deleteFolder(id: string): Promise<void> {
  await apiDelete(`/api/folders/${id}`);
}

export async function moveWorkspaceToFolder(folderId: string, workspaceId: string): Promise<void> {
  await apiPatch(`/api/folders/${folderId}/move-workspace`, { workspaceId });
}

export async function unfileWorkspace(workspaceId: string): Promise<void> {
  await apiPost("/api/folders/unfile-workspace", { workspaceId });
}

export async function toggleFolderFavorite(id: string, isFavorite: boolean): Promise<void> {
  await apiPatch(`/api/folders/${id}/favorite`, { isFavorite });
}

export async function moveFolderToFolder(folderId: string, parentId: string | null): Promise<void> {
  await apiPatch(`/api/folders/${folderId}/move`, { parentId });
}
