import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkspaceSort } from "./use-workspace-sort";
import type { WorkspaceItem } from "@/lib/workspace-client";

const mockWorkspaces: WorkspaceItem[] = [
  { workspaceId: "ws-1", title: "Alpha", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-03T00:00:00Z", isFavorite: false, folderId: null },
  { workspaceId: "ws-2", title: "Beta", createdAt: "2026-01-02T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", isFavorite: false, folderId: null },
  { workspaceId: "ws-3", title: "Charlie", createdAt: "2026-01-03T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z", isFavorite: true, folderId: null },
];

describe("useWorkspaceSort", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to updatedAt descending", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(result.current.sortConfig).toEqual({ field: "updatedAt", direction: "desc" });
  });

  it("separates favorites from others", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].workspaceId).toBe("ws-3");
    expect(result.current.others).toHaveLength(2);
  });

  it("toggles direction when clicking same field", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    act(() => { result.current.setSort("updatedAt"); });
    // Was desc, should toggle to asc
    expect(result.current.sortConfig.direction).toBe("asc");
  });

  it("defaults title to ascending on first click", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    act(() => { result.current.setSort("title"); });
    expect(result.current.sortConfig).toEqual({ field: "title", direction: "asc" });
  });

  it("defaults date fields to descending on first click", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    // Switch to title first, then switch to createdAt
    act(() => { result.current.setSort("title"); });
    act(() => { result.current.setSort("createdAt"); });
    expect(result.current.sortConfig).toEqual({ field: "createdAt", direction: "desc" });
  });

  it("persists sort preference to localStorage", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    act(() => { result.current.setSort("title"); });
    const stored = JSON.parse(localStorage.getItem("hub-sort")!);
    expect(stored).toEqual({ field: "title", direction: "asc" });
  });

  it("loads sort preference from localStorage", () => {
    localStorage.setItem("hub-sort", JSON.stringify({ field: "title", direction: "desc" }));
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(result.current.sortConfig).toEqual({ field: "title", direction: "desc" });
  });

  it("excludes workspaces with folderId from others", () => {
    const workspacesWithFolders: WorkspaceItem[] = [
      ...mockWorkspaces,
      { workspaceId: "ws-4", title: "Filed", createdAt: "2026-01-04T00:00:00Z", updatedAt: "2026-01-04T00:00:00Z", isFavorite: false, folderId: "folder-1" },
    ];
    const { result } = renderHook(() => useWorkspaceSort(workspacesWithFolders));
    // ws-4 has a folderId so it should NOT appear in others
    expect(result.current.others.find((ws) => ws.workspaceId === "ws-4")).toBeUndefined();
    // The other non-favorited, unfiled workspaces should still be there
    expect(result.current.others).toHaveLength(2);
  });

  it("includes favorited workspaces even if they have a folderId", () => {
    const workspacesWithFolders: WorkspaceItem[] = [
      ...mockWorkspaces,
      { workspaceId: "ws-5", title: "Fav+Filed", createdAt: "2026-01-05T00:00:00Z", updatedAt: "2026-01-05T00:00:00Z", isFavorite: true, folderId: "folder-1" },
    ];
    const { result } = renderHook(() => useWorkspaceSort(workspacesWithFolders));
    // ws-5 is favorited so it should appear in favorites regardless of folderId
    expect(result.current.favorites.find((ws) => ws.workspaceId === "ws-5")).toBeDefined();
  });
});
