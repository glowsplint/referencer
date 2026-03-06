import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage-keys";

function loadCollapsed(documentId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLAPSED_PREFIX + documentId);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveCollapsed(documentId: string, ids: Set<string>) {
  localStorage.setItem(STORAGE_KEYS.COLLAPSED_PREFIX + documentId, JSON.stringify([...ids]));
}

export function useCollapsedAnnotations(documentId: string) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => loadCollapsed(documentId));

  const toggleCollapse = useCallback(
    (id: string) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveCollapsed(documentId, next);
        return next;
      });
    },
    [documentId],
  );

  const collapseAll = useCallback(
    (ids: string[]) => {
      setCollapsedIds(() => {
        const next = new Set(ids);
        saveCollapsed(documentId, next);
        return next;
      });
    },
    [documentId],
  );

  const expandAll = useCallback(() => {
    setCollapsedIds(() => {
      const next = new Set<string>();
      saveCollapsed(documentId, next);
      return next;
    });
  }, [documentId]);

  return { collapsedIds, toggleCollapse, collapseAll, expandAll };
}
