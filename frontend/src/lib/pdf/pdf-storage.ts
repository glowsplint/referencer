import { apiPost, apiFetch } from "@/lib/api-client";

export async function uploadPdf(
  documentId: string,
  paneIndex: number,
  file: File,
): Promise<{ storageKey: string }> {
  // Convert file to base64 to send as JSON (backend CSRF requires application/json)
  const buffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ""),
  );
  return apiPost<{ storageKey: string }>(`/api/documents/${documentId}/pdf`, {
    paneIndex,
    filename: file.name,
    data: base64,
  });
}

export async function getPdfUrl(documentId: string, storageKey: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>(
    `/api/documents/${documentId}/pdf/${encodeURIComponent(storageKey)}`,
  );
}
