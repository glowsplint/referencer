// Draggable vertical divider for resizing the management pane. Reports pixel
// width rather than percentage, clamped to [150px, 500px].
import { useCallback } from "react";
import { GripVertical } from "lucide-react";

const MIN_WIDTH = 150;
const MAX_WIDTH = 500;

interface ManagementPaneDividerProps {
  width: number;
  onResize: (width: number) => void;
  onResizeEnd: (width: number) => void;
}

export function ManagementPaneDivider({
  width,
  onResize,
  onResizeEnd,
}: ManagementPaneDividerProps) {
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      document.body.style.userSelect = "none";
      const startX = e.clientX;
      const startWidth = width;
      let currentWidth = startWidth;

      const onMouseMove = (e: MouseEvent) => {
        currentWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + e.clientX - startX));
        onResize(currentWidth);
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.userSelect = "";
        onResizeEnd(currentWidth);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width, onResize, onResizeEnd],
  );

  return (
    <div
      data-testid="management-pane-divider"
      onMouseDown={handleMouseDown}
      className="flex flex-col items-center w-3 h-full cursor-col-resize hover:bg-accent transition-colors shrink-0"
    >
      <div className="flex-1 w-px bg-gray-300" />
      <GripVertical size={14} className="text-muted-foreground shrink-0" />
      <div className="flex-1 w-px bg-gray-300" />
    </div>
  );
}
