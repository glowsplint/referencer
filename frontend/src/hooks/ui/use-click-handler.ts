import { useCallback, useRef } from "react";

/**
 * Disambiguates single-click (select) from double-click (open/navigate).
 * Modifier clicks (Ctrl/Cmd/Shift) fire immediately — they're always selection.
 */
export function useClickHandler(
  onSingleClick: (e: React.MouseEvent) => void,
  onDoubleClick: (e: React.MouseEvent) => void,
  delay = 250,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEventRef = useRef<React.MouseEvent | null>(null);

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

      if (timerRef.current) {
        // Second click within delay window — it's a double-click
        clearTimeout(timerRef.current);
        timerRef.current = null;
        onDoubleClick(e);
      } else {
        // First click — start timer; persist event data
        lastEventRef.current = e;
        // Prevent React from recycling the event
        e.persist?.();
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          onSingleClick(lastEventRef.current!);
        }, delay);
      }
    },
    [onSingleClick, onDoubleClick, delay],
  );

  return handleClick;
}
