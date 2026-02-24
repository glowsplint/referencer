import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage-keys";

export function useFolderCollapse(folderId: string) {
  const key = STORAGE_KEYS.COLLAPSED_PREFIX + "folder-" + folderId;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem(key) === "true";
  });

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (next) {
        localStorage.setItem(key, "true");
      } else {
        localStorage.removeItem(key);
      }
      return next;
    });
  }, [key]);

  return { isCollapsed, toggleCollapsed };
}
