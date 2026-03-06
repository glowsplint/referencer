import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchDocuments,
  createDocument,
  renameDocument,
  touchDocument,
  deleteDocument,
  duplicateDocument,
} from "./document-client";

vi.mock("@/lib/api-client", () => ({
  apiFetch: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiFetch, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
const mockApiFetch = vi.mocked(apiFetch);
const mockApiPost = vi.mocked(apiPost);
const mockApiPatch = vi.mocked(apiPatch);
const mockApiDelete = vi.mocked(apiDelete);

describe("when using document-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("when using fetchDocuments", () => {
    it("then calls /api/documents and returns data", async () => {
      const mockData = [
        { documentId: "id-1", title: "Test", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      ];
      mockApiFetch.mockResolvedValue(mockData);

      const result = await fetchDocuments();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/documents");
      expect(result).toEqual(mockData);
    });

    it("then throws when apiFetch throws", async () => {
      mockApiFetch.mockRejectedValue(new Error("Failed to fetch documents"));

      await expect(fetchDocuments()).rejects.toThrow("Failed to fetch documents");
    });
  });

  describe("when using createDocument", () => {
    it("then sends POST with correct body", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await createDocument("ws-123", "My Document");
      expect(mockApiPost).toHaveBeenCalledWith("/api/documents", {
        documentId: "ws-123",
        title: "My Document",
      });
    });

    it("then sends POST without title when not provided", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await createDocument("ws-123");
      expect(mockApiPost).toHaveBeenCalledWith("/api/documents", {
        documentId: "ws-123",
        title: undefined,
      });
    });
  });

  describe("when using renameDocument", () => {
    it("then sends PATCH with correct body", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await renameDocument("ws-123", "New Title");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/documents/ws-123", { title: "New Title" });
    });
  });

  describe("when using touchDocument", () => {
    it("then sends PATCH to correct URL", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await touchDocument("ws-123");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/documents/ws-123/touch");
    });
  });

  describe("when using deleteDocument", () => {
    it("then sends DELETE to correct URL", async () => {
      mockApiDelete.mockResolvedValue(undefined);

      await deleteDocument("ws-123");
      expect(mockApiDelete).toHaveBeenCalledWith("/api/documents/ws-123");
    });
  });

  describe("when using duplicateDocument", () => {
    it("then sends POST with correct body", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await duplicateDocument("source-id", "new-id");
      expect(mockApiPost).toHaveBeenCalledWith("/api/documents/source-id/duplicate", {
        newDocumentId: "new-id",
      });
    });
  });
});
