import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveWorkspaceToFolder,
  unfileWorkspace,
  toggleFolderFavorite,
  moveFolderToFolder,
} from "./folder-client";

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

describe("folder-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchFolders", () => {
    it("calls /api/folders and returns data", async () => {
      const mockData = [{ id: "f1", parentId: null, name: "Test", isFavorite: false }];
      mockApiFetch.mockResolvedValue(mockData);

      const result = await fetchFolders();
      expect(mockApiFetch).toHaveBeenCalledWith("/api/folders");
      expect(result).toEqual(mockData);
    });
  });

  describe("createFolder", () => {
    it("sends POST with correct body", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await createFolder("f1", null, "My Folder");
      expect(mockApiPost).toHaveBeenCalledWith("/api/folders", {
        id: "f1",
        parentId: null,
        name: "My Folder",
      });
    });

    it("sends POST with parentId when provided", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await createFolder("f2", "f1", "Child Folder");
      expect(mockApiPost).toHaveBeenCalledWith("/api/folders", {
        id: "f2",
        parentId: "f1",
        name: "Child Folder",
      });
    });
  });

  describe("renameFolder", () => {
    it("sends PATCH with correct body", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await renameFolder("f1", "New Name");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/folders/f1", { name: "New Name" });
    });
  });

  describe("deleteFolder", () => {
    it("sends DELETE to correct URL", async () => {
      mockApiDelete.mockResolvedValue(undefined);

      await deleteFolder("f1");
      expect(mockApiDelete).toHaveBeenCalledWith("/api/folders/f1");
    });
  });

  describe("moveWorkspaceToFolder", () => {
    it("sends PATCH with workspaceId", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await moveWorkspaceToFolder("f1", "ws-1");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/folders/f1/move-workspace", {
        workspaceId: "ws-1",
      });
    });
  });

  describe("unfileWorkspace", () => {
    it("sends POST with workspaceId", async () => {
      mockApiPost.mockResolvedValue(undefined);

      await unfileWorkspace("ws-1");
      expect(mockApiPost).toHaveBeenCalledWith("/api/folders/unfile-workspace", {
        workspaceId: "ws-1",
      });
    });
  });

  describe("toggleFolderFavorite", () => {
    it("sends PATCH to correct endpoint with isFavorite=true", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await toggleFolderFavorite("f1", true);
      expect(mockApiPatch).toHaveBeenCalledWith("/api/folders/f1/favorite", { isFavorite: true });
    });

    it("sends PATCH with isFavorite=false", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await toggleFolderFavorite("f1", false);
      expect(mockApiPatch).toHaveBeenCalledWith("/api/folders/f1/favorite", { isFavorite: false });
    });
  });

  describe("moveFolderToFolder", () => {
    it("sends PATCH with parentId", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await moveFolderToFolder("f2", "f1");
      expect(mockApiPatch).toHaveBeenCalledWith("/api/folders/f2/move", { parentId: "f1" });
    });

    it("sends PATCH with null parentId to move to root", async () => {
      mockApiPatch.mockResolvedValue(undefined);

      await moveFolderToFolder("f2", null);
      expect(mockApiPatch).toHaveBeenCalledWith("/api/folders/f2/move", { parentId: null });
    });
  });
});
