import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWorkspaceSort } from "./use-workspace-sort";
import type { WorkspaceItem } from "@/lib/workspace-client";

const mockWorkspaces: WorkspaceItem[] = [
  { workspaceId: "ws-1", title: "Alpha", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-03T00:00:00Z", isFavorite: false },
  { workspaceId: "ws-2", title: "Beta", createdAt: "2026-01-02T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", isFavorite: false },
  { workspaceId: "ws-3", title: "Charlie", createdAt: "2026-01-03T00:00:00Z", updatedAt: "2026-01-02T00:00:00Z", isFavorite: true },
];

describe("useWorkspaceSort", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to updatedAt descending", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    expect(result.current.sortConfig).toEqual({ field: "updatedAt", direction: "desc" });
  });

  it("sorts favorites first regardless of sort field", () => {
    const { result } = renderHook(() => useWorkspaceSort(mockWorkspaces));
    // Charlie (favorite) should be first
    expect(result.current.sorted[0].workspaceId).toBe("ws-3");
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
});
