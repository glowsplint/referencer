import { apiFetch, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export interface WorkspaceItem {
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

export async function fetchWorkspaces(): Promise<WorkspaceItem[]> {
  return apiFetch<WorkspaceItem[]>("/api/workspaces");
}

export async function fetchWorkspace(workspaceId: string): Promise<WorkspaceItem | null> {
  try {
    return await apiFetch<WorkspaceItem>(`/api/workspaces/${workspaceId}`);
  } catch {
    return null;
  }
}

export async function createWorkspace(workspaceId: string, title?: string): Promise<void> {
  await apiPost("/api/workspaces", { workspaceId, title });
}

export async function renameWorkspace(workspaceId: string, title: string): Promise<void> {
  await apiPatch(`/api/workspaces/${workspaceId}`, { title });
}

export async function touchWorkspace(workspaceId: string): Promise<void> {
  await apiPatch(`/api/workspaces/${workspaceId}/touch`);
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await apiDelete(`/api/workspaces/${workspaceId}`);
}

export async function toggleFavorite(workspaceId: string, isFavorite: boolean): Promise<void> {
  await apiPatch(`/api/workspaces/${workspaceId}/favorite`, { isFavorite });
}

export async function duplicateWorkspace(sourceId: string, newId: string): Promise<void> {
  await apiPost(`/api/workspaces/${sourceId}/duplicate`, { newWorkspaceId: newId });
}
