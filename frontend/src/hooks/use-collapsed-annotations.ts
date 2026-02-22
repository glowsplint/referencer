import { useState, useCallback } from "react";

const STORAGE_PREFIX = "referencer-collapsed-";

function loadCollapsed(workspaceId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + workspaceId);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveCollapsed(workspaceId: string, ids: Set<string>) {
  localStorage.setItem(STORAGE_PREFIX + workspaceId, JSON.stringify([...ids]));
}

export function useCollapsedAnnotations(workspaceId: string) {
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => loadCollapsed(workspaceId));

  const toggleCollapse = useCallback(
    (id: string) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        saveCollapsed(workspaceId, next);
        return next;
      });
    },
    [workspaceId],
  );

  const collapseAll = useCallback(
    (ids: string[]) => {
      setCollapsedIds(() => {
        const next = new Set(ids);
        saveCollapsed(workspaceId, next);
        return next;
      });
    },
    [workspaceId],
  );

  const expandAll = useCallback(() => {
    setCollapsedIds(() => {
      const next = new Set<string>();
      saveCollapsed(workspaceId, next);
      return next;
    });
  }, [workspaceId]);

  return { collapsedIds, toggleCollapse, collapseAll, expandAll };
}
