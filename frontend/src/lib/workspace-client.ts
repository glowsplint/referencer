const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface WorkspaceItem {
  workspaceId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchWorkspaces(): Promise<WorkspaceItem[]> {
  const res = await fetch(`${API_URL}/api/workspaces`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch workspaces");
  return res.json();
}

export async function createWorkspace(workspaceId: string, title?: string): Promise<void> {
  await fetch(`${API_URL}/api/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspaceId, title }),
    credentials: "include",
  });
}

export async function renameWorkspace(workspaceId: string, title: string): Promise<void> {
  await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
    credentials: "include",
  });
}

export async function touchWorkspace(workspaceId: string): Promise<void> {
  await fetch(`${API_URL}/api/workspaces/${workspaceId}/touch`, {
    method: "PATCH",
    credentials: "include",
  });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await fetch(`${API_URL}/api/workspaces/${workspaceId}`, {
    method: "DELETE",
    credentials: "include",
  });
}

export async function duplicateWorkspace(sourceId: string, newId: string): Promise<void> {
  await fetch(`${API_URL}/api/workspaces/${sourceId}/duplicate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newWorkspaceId: newId }),
    credentials: "include",
  });
}
