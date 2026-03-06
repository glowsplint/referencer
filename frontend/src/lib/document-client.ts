import { apiFetch, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export interface DocumentItem {
  documentId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  folderId: string | null;
}

export async function fetchDocuments(): Promise<DocumentItem[]> {
  return apiFetch<DocumentItem[]>("/api/documents");
}

export async function fetchDocument(documentId: string): Promise<DocumentItem | null> {
  try {
    return await apiFetch<DocumentItem>(`/api/documents/${documentId}`);
  } catch {
    return null;
  }
}

export async function createDocument(documentId: string, title?: string): Promise<void> {
  await apiPost("/api/documents", { documentId, title });
}

export async function renameDocument(documentId: string, title: string): Promise<void> {
  await apiPatch(`/api/documents/${documentId}`, { title });
}

export async function touchDocument(documentId: string): Promise<void> {
  await apiPatch(`/api/documents/${documentId}/touch`);
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiDelete(`/api/documents/${documentId}`);
}

export async function toggleFavorite(documentId: string, isFavorite: boolean): Promise<void> {
  await apiPatch(`/api/documents/${documentId}/favorite`, { isFavorite });
}

export async function duplicateDocument(sourceId: string, newId: string): Promise<void> {
  await apiPost(`/api/documents/${sourceId}/duplicate`, { newDocumentId: newId });
}
