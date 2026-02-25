import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchWorkspaces,
  createWorkspace,
  renameWorkspace,
  touchWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
} from "./workspace-client";

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

describe("when using workspace-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("when using fetchWorkspaces", () => {
    it("then calls /api/workspaces and returns data", async () => {
      const mockData = [
        { workspaceId: "id-1", title: "Test", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      ];
      mockApiFetch.mockResolvedValue(mockData);

      const result = await fetchWorkspaces();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/workspaces");
      expect(result).toEqual(mockData);
    });

    it("then throws when apiFetch throws", async () => {
      mockApiFetch.mockRejectedValue(new Error("Failed to fetch workspaces"));

      await expect(fetchWorkspaces()).rejects.toThrow("Failed to fetch workspaces");
    });
  });

  describe("when using createWorkspace", () => {
    it("then sends POST with correct body", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await createWorkspace("ws-123", "My Workspace");
      expect(mockApiPost).toHaveBeenCalledWith("/api/workspaces", {
        workspaceId: "ws-123",
        title: "My Workspace",
      });
    });

    it("then sends POST without title when not provided", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await createWorkspace("ws-123");
      expect(mockApiPost).toHaveBeenCalledWith("/api/workspaces", {
        workspaceId: "ws-123",
        title: undefined,
      });
    });
  });

  describe("when using renameWorkspace", () => {
    it("then sends PATCH with correct body", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await renameWorkspace("ws-123", "New Title");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/workspaces/ws-123", { title: "New Title" });
    });
  });

  describe("when using touchWorkspace", () => {
    it("then sends PATCH to correct URL", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await touchWorkspace("ws-123");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/workspaces/ws-123/touch");
    });
  });

  describe("when using deleteWorkspace", () => {
    it("then sends DELETE to correct URL", async () => {
      mockApiDelete.mockResolvedValue(undefined);

      await deleteWorkspace("ws-123");
      expect(mockApiDelete).toHaveBeenCalledWith("/api/workspaces/ws-123");
    });
  });

  describe("when using duplicateWorkspace", () => {
    it("then sends POST with correct body", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await duplicateWorkspace("source-id", "new-id");
      expect(mockApiPost).toHaveBeenCalledWith("/api/workspaces/source-id/duplicate", {
        newWorkspaceId: "new-id",
      });
    });
  });
});
