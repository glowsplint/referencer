// Draggable divider for resizing adjacent editor panes. Supports both
// horizontal (column) and vertical (row) orientations. Reports the drag
// position as a percentage of the container, clamped to 20%-80%.
import { useCallback, type RefObject } from "react";
import { GripVertical, GripHorizontal } from "lucide-react";

interface DividerProps {
  onResize: (pct: number) => void;
  containerRef: RefObject<HTMLDivElement | null>;
  direction?: "horizontal" | "vertical";
}

export function Divider({ onResize, containerRef, direction = "horizontal" }: DividerProps) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      document.body.style.userSelect = "none";

      const onMouseMove = (e: MouseEvent) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        // Convert mouse position to percentage of container, clamped to [20%, 80%]
        const pct =
          direction === "horizontal"
            ? ((e.clientX - rect.left) / rect.width) * 100
            : ((e.clientY - rect.top) / rect.height) * 100;
        onResize(Math.min(80, Math.max(20, pct)));
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [onResize, containerRef, direction],
  );

  const isHorizontal = direction === "horizontal";

  return (
    <div
      role="separator"
      data-testid="divider"
      onMouseDown={handleMouseDown}
      className={
        isHorizontal
          ? "flex flex-col items-center w-3 h-full cursor-col-resize hover:bg-accent transition-colors shrink-0"
          : "flex flex-row items-center w-full h-3 cursor-row-resize hover:bg-accent transition-colors shrink-0"
      }
    >
      <div className={isHorizontal ? "flex-1 w-px bg-gray-300" : "flex-1 h-px bg-gray-300"} />
      {isHorizontal ? (
        <GripVertical size={14} className="text-muted-foreground shrink-0" />
      ) : (
        <GripHorizontal size={14} className="text-muted-foreground shrink-0" />
      )}
      <div className={isHorizontal ? "flex-1 w-px bg-gray-300" : "flex-1 h-px bg-gray-300"} />
    </div>
  );
}
