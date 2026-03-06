import { useCallback, useRef } from "react";

/**
 * Disambiguates single-click (select) from double-click (open/navigate).
 *
 * Single-click fires immediately for instant feedback. A short timer detects
 * whether a second click follows — if so, onDoubleClick fires instead.
 *
 * When `immediate` is true (e.g. selection mode is active), double-click
 * detection is skipped entirely — every click fires onSingleClick instantly.
 */
export function useClickHandler(
  onSingleClick: (e: React.MouseEvent) => void,
  onDoubleClick: (e: React.MouseEvent) => void,
  immediate = false,
  delay = 250,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Modifier clicks always fire immediately as single-click (selection)
      if (e.ctrlKey || e.metaKey || e.shiftKey) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        onSingleClick(e);
        return;
      }

      // Double-click detection: if timer is running, second click arrived
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        onDoubleClick(e);
        return;
      }

      // Fire single-click immediately
      onSingleClick(e);

      // Start double-click detection window (unless in immediate mode)
      if (!immediate) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
        }, delay);
      }
    },
    [onSingleClick, onDoubleClick, delay, immediate],
  );

  return handleClick;
}
