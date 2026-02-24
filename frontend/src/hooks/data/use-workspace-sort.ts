import { useState, useMemo, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { WorkspaceItem } from "@/lib/workspace-client";

export type SortField = "title" | "createdAt" | "updatedAt";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

function loadSort(): SortConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HUB_SORT);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { field: "updatedAt", direction: "desc" };
}

export function useWorkspaceSort(workspaces: WorkspaceItem[]) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(loadSort);

  const setSort = useCallback((field: SortField) => {
    setSortConfig((prev) => {
      const direction =
        prev.field === field
          ? prev.direction === "asc"
            ? "desc"
            : "asc"
          : field === "title"
            ? "asc"
            : "desc";
      const next: SortConfig = { field, direction };
      localStorage.setItem(STORAGE_KEYS.HUB_SORT, JSON.stringify(next));
      return next;
    });
  }, []);

  const sorted = useMemo(() => {
    const arr = [...workspaces];
    arr.sort((a, b) => {
      // Favorites always first
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;

      const { field, direction } = sortConfig;
      let cmp = 0;
      if (field === "title") {
        cmp = (a.title || "").localeCompare(b.title || "");
      } else {
        cmp = a[field].localeCompare(b[field]);
      }
      return direction === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [workspaces, sortConfig]);

  return { sorted, sortConfig, setSort };
}
