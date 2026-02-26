import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage-keys";

export function useFolderCollapse(folderId: string) {
  const key = STORAGE_KEYS.FOLDER_COLLAPSED_PREFIX + folderId;

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        if (next) {
          localStorage.setItem(key, "true");
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        /* quota exceeded or unavailable */
      }
      return next;
    });
  }, [key]);

  return { isCollapsed, toggleCollapsed };
}
