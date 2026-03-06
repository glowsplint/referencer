import { useState, useMemo, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { DocumentItem } from "@/lib/document-client";

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

export function useDocumentSort(documents: DocumentItem[]) {
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
      try {
        localStorage.setItem(STORAGE_KEYS.HUB_SORT, JSON.stringify(next));
      } catch {
        /* quota exceeded or unavailable */
      }
      return next;
    });
  }, []);

  const compare = useCallback(
    (a: DocumentItem, b: DocumentItem) => {
      const { field, direction } = sortConfig;
      let cmp = 0;
      if (field === "title") {
        cmp = (a.title || "").localeCompare(b.title || "");
      } else {
        cmp = a[field].localeCompare(b[field]);
      }
      return direction === "asc" ? cmp : -cmp;
    },
    [sortConfig],
  );

  const favorites = useMemo(
    () => documents.filter((ws) => ws.isFavorite).sort(compare),
    [documents, compare],
  );

  const others = useMemo(
    () => documents.filter((ws) => !ws.isFavorite && !ws.folderId).sort(compare),
    [documents, compare],
  );

  return { favorites, others, sortConfig, setSort, compare };
}
