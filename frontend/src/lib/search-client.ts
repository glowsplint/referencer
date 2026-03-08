import { apiFetch } from "@/lib/api-client";

export interface SearchResult {
  annotation_id: string;
  document_id: string;
  document_title: string;
  layer_id: string;
  layer_name: string;
  annotation_type: "highlight" | "comment" | "arrow" | "underline";
  selected_text: string;
  annotation_text: string;
  reply_texts: string;
  user_name: string;
  rank: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export async function searchAnnotations(
  query: string,
  limit?: number,
  offset?: number,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query });
  if (limit !== undefined) params.set("limit", String(limit));
  if (offset !== undefined) params.set("offset", String(offset));
  return apiFetch<SearchResponse>(`/api/search?${params}`);
}
