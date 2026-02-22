import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchWorkspaces,
  createWorkspace,
  renameWorkspace,
  touchWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
} from "./workspace-client";

describe("workspace-client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchWorkspaces", () => {
    it("calls /api/workspaces with credentials and returns data", async () => {
      const mockData = [
        { workspaceId: "id-1", title: "Test", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
      ];
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      const result = await fetchWorkspaces();
      expect(fetch).toHaveBeenCalledWith("/api/workspaces", { credentials: "include" });
      expect(result).toEqual(mockData);
    });

    it("throws when response is not ok", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(fetchWorkspaces()).rejects.toThrow("Failed to fetch workspaces");
    });
  });

  describe("createWorkspace", () => {
    it("sends POST with correct body", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

      await createWorkspace("ws-123", "My Workspace");
      expect(fetch).toHaveBeenCalledWith("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-123", title: "My Workspace" }),
        credentials: "include",
      });
    });

    it("sends POST without title when not provided", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

      await createWorkspace("ws-123");
      expect(fetch).toHaveBeenCalledWith("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: "ws-123" }),
        credentials: "include",
      });
    });
  });

  describe("renameWorkspace", () => {
    it("sends PATCH with correct body", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

      await renameWorkspace("ws-123", "New Title");
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/ws-123", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Title" }),
        credentials: "include",
      });
    });
  });

  describe("touchWorkspace", () => {
    it("sends PATCH to correct URL", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

      await touchWorkspace("ws-123");
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/ws-123/touch", {
        method: "PATCH",
        credentials: "include",
      });
    });
  });

  describe("deleteWorkspace", () => {
    it("sends DELETE to correct URL", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

      await deleteWorkspace("ws-123");
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/ws-123", {
        method: "DELETE",
        credentials: "include",
      });
    });
  });

  describe("duplicateWorkspace", () => {
    it("sends POST with correct body", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true } as Response);

      await duplicateWorkspace("source-id", "new-id");
      expect(fetch).toHaveBeenCalledWith("/api/workspaces/source-id/duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newWorkspaceId: "new-id" }),
        credentials: "include",
      });
    });
  });
});
