// Manages user-defined custom colors persisted in localStorage.
// Provides add/remove operations that sync to both React state and storage.
import { useState, useCallback } from "react";
import { STORAGE_KEYS } from "@/constants/storage-keys";

function loadColors(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_COLORS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveColors(colors: string[]) {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_COLORS, JSON.stringify(colors));
}

export function useCustomColors() {
  const [customColors, setCustomColors] = useState<string[]>(loadColors);

  const addCustomColor = useCallback((hex: string) => {
    setCustomColors((prev) => {
      if (prev.includes(hex)) return prev;
      const next = [...prev, hex];
      saveColors(next);
      return next;
    });
  }, []);

  const removeCustomColor = useCallback((hex: string) => {
    setCustomColors((prev) => {
      const next = prev.filter((c) => c !== hex);
      saveColors(next);
      return next;
    });
  }, []);

  return { customColors, addCustomColor, removeCustomColor };
}
