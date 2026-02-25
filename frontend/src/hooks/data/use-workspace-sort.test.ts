import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkspaceSort } from "./use-workspace-sort";
import type { WorkspaceItem } from "@/lib/workspace-client";

const mockWorkspaces: WorkspaceItem[] = [
  {
    workspaceId: "ws-1",
    title: "Alpha",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-03T00:00:00Z",
    isFavorite: false,
    folderId: null,
  },
  {
    workspaceId: "ws-2",
    title: "Beta",
    createdAt: "2026-01-02T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    isFavorite: false,
    folderId: null,
  },
  {
    workspaceId: "ws-3",
    title: "Charlie",
    createdAt: "2026-01-03T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    isFavorite: true,
    folderId: null,
  },
];

describe("useWorkspaceSort", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("when initialized, then defaults to updatedAt descending", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(result.current.sortConfig).toEqual({ field: "updatedAt", direction: "desc" });
  });

  it("when workspaces include favorites, then separates them from others", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0].workspaceId).toBe("ws-3");
    expect(result.current.others).toHaveLength(2);
  });

  it("when the same field is clicked again, then toggles direction", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    act(() => {
      result.current.setSort("updatedAt");
    });
    // Was desc, should toggle to asc
    expect(result.current.sortConfig.direction).toBe("asc");
  });

  it("when title is clicked first time, then defaults to ascending", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    act(() => {
      result.current.setSort("title");
    });
    expect(result.current.sortConfig).toEqual({ field: "title", direction: "asc" });
  });

  it("when a date field is clicked first time, then defaults to descending", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    // Switch to title first, then switch to createdAt
    act(() => {
      result.current.setSort("title");
    });
    act(() => {
      result.current.setSort("createdAt");
    });
    expect(result.current.sortConfig).toEqual({ field: "createdAt", direction: "desc" });
  });

  it("when sort is changed, then persists preference to localStorage", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    act(() => {
      result.current.setSort("title");
    });
    const stored = JSON.parse(localStorage.getItem("hub-sort")!);
    expect(stored).toEqual({ field: "title", direction: "asc" });
  });

  it("when localStorage has sort preference, then loads it", () => {
    localStorage.setItem("hub-sort", JSON.stringify({ field: "title", direction: "desc" }));
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(result.current.sortConfig).toEqual({ field: "title", direction: "desc" });
  });

  it("when workspaces have folderId, then excludes them from others", () => {
    const workspacesWithFolders: WorkspaceItem[] = [
      ...mockWorkspaces,
      {
        workspaceId: "ws-4",
        title: "Filed",
        createdAt: "2026-01-04T00:00:00Z",
        updatedAt: "2026-01-04T00:00:00Z",
        isFavorite: false,
        folderId: "folder-1",
      },
    ];
    const { result } = renderHook(() => useWorkspaceSort(workspacesWithFolders));
    // ws-4 has a folderId so it should NOT appear in others
    expect(result.current.others.find((ws) => ws.workspaceId === "ws-4")).toBeUndefined();
    // The other non-favorited, unfiled workspaces should still be there
    expect(result.current.others).toHaveLength(2);
  });

  it("when favorited workspaces have a folderId, then still includes them", () => {
    const workspacesWithFolders: WorkspaceItem[] = [
      ...mockWorkspaces,
      {
        workspaceId: "ws-5",
        title: "Fav+Filed",
        createdAt: "2026-01-05T00:00:00Z",
        updatedAt: "2026-01-05T00:00:00Z",
        isFavorite: true,
        folderId: "folder-1",
      },
    ];
    const { result } = renderHook(() => useWorkspaceSort(workspacesWithFolders));
    // ws-5 is favorited so it should appear in favorites regardless of folderId
    expect(result.current.favorites.find((ws) => ws.workspaceId === "ws-5")).toBeDefined();
  });

  it("when accessed, then returns a compare function", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(typeof result.current.compare).toBe("function");
  });

  it("when compare is used, then sorts by the current sort field", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    // Default is updatedAt desc
    const a = mockWorkspaces[0]; // updatedAt: 2026-01-03
    const b = mockWorkspaces[1]; // updatedAt: 2026-01-01
    // desc => newer first => a should come before b => compare(a, b) < 0
    expect(result.current.compare(a, b)).toBeLessThan(0);
  });
});
