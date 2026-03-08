import { apiFetch, apiPost, apiDelete } from "@/lib/api-client";

export interface TagsResponse {
  allTags: string[];
  documentTags: Record<string, string[]>;
}

export async function fetchTags(): Promise<TagsResponse> {
  return apiFetch<TagsResponse>("/api/tags");
}

export async function addTag(documentId: string, tag: string): Promise<void> {
  await apiPost(`/api/tags/${documentId}`, { tag });
}

export async function removeTag(documentId: string, tag: string): Promise<void> {
  await apiDelete(`/api/tags/${documentId}/${encodeURIComponent(tag)}`);
}
