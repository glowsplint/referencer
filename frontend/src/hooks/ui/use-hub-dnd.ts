import { useEffect, useRef } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useDndContext } from "@/contexts/DndContext";

export type DragItemType = "workspace" | "folder";

export interface DragData {
  [key: string]: unknown;
  type: DragItemType;
  id: string;
}

export function useDraggable(type: DragItemType, id: string) {
  const ref = useRef<HTMLDivElement>(null);
  const { setDragState, resetDrag } = useDndContext();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => ({ type, id }) as DragData,
      onDragStart: () => setDragState({ isDragging: true, dragType: type, dragId: id }),
      onDrop: () => resetDrag(),
    });
  }, [type, id, setDragState, resetDrag]);

  return ref;
}

export function useDropTarget(
  targetId: string,
  onDrop: (data: DragData) => void,
  canDrop?: (data: DragData) => boolean,
) {
  const ref = useRef<HTMLDivElement>(null);
  const { setDragState } = useDndContext();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return dropTargetForElements({
      element: el,
      getData: () => ({ targetId }),
      canDrop: ({ source }) => {
        const data = source.data as DragData;
        if (!data.type || !data.id) return false;
        if (canDrop) return canDrop(data);
        return true;
      },
      onDragEnter: () => setDragState({ overTargetId: targetId }),
      onDragLeave: () => setDragState({ overTargetId: null }),
      onDrop: ({ source }) => {
        setDragState({ overTargetId: null });
        onDrop(source.data as DragData);
      },
    });
  }, [targetId, onDrop, canDrop, setDragState]);

  return ref;
}
