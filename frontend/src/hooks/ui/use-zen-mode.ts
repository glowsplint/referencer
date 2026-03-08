import { useState, useEffect, useRef, useCallback } from "react";

export function useZenMode() {
  const [isZenMode, setIsZenMode] = useState(false);
  const lastEscapeTimeRef = useRef(0);

  const enterZenMode = useCallback(() => setIsZenMode(true), []);
  const exitZenMode = useCallback(() => setIsZenMode(false), []);

  useEffect(() => {
    if (!isZenMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const now = Date.now();
      if (now - lastEscapeTimeRef.current < 500) {
        exitZenMode();
        lastEscapeTimeRef.current = 0;
      } else {
        lastEscapeTimeRef.current = now;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isZenMode, exitZenMode]);

  return { isZenMode, enterZenMode, exitZenMode };
}
