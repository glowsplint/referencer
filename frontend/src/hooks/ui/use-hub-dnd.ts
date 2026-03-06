import { useEffect, useRef } from "react";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview";
import { useDndContext } from "@/contexts/DndContext";

export type DragItemType = "document" | "folder";

export interface DragItem {
  type: DragItemType;
  id: string;
}

export interface DragData {
  [key: string]: unknown;
  type: DragItemType;
  id: string;
  selectedItems?: DragItem[];
}

interface DraggableOptions {
  isSelected?: boolean;
  getSelectedItems?: () => DragItem[];
  onClearSelection?: () => void;
}

export function useDraggable(type: DragItemType, id: string, options: DraggableOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const { setDragState, resetDrag } = useDndContext();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    return draggable({
      element: el,
      getInitialData: () => {
        const { isSelected, getSelectedItems, onClearSelection } = optionsRef.current;
        if (isSelected && getSelectedItems) {
          const selectedItems = getSelectedItems();
          return { type, id, selectedItems } as DragData;
        }
        // Dragging a non-selected item: clear selection
        onClearSelection?.();
        return { type, id, selectedItems: [{ type, id }] } as DragData;
      },
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        const { isSelected, getSelectedItems } = optionsRef.current;
        const items = isSelected && getSelectedItems ? getSelectedItems() : [{ type, id }];
        if (items.length <= 1) return; // Use default browser preview for single item

        setCustomNativeDragPreview({
          nativeSetDragImage,
          render({ container }) {
            const root = document.createElement("div");
            root.style.cssText = `
              position: relative;
              width: 200px;
              height: 60px;
            `;

            // Stacked cards
            const cardCount = Math.min(items.length, 3);
            for (let i = cardCount - 1; i >= 0; i--) {
              const card = document.createElement("div");
              card.style.cssText = `
                position: absolute;
                top: ${i * 4}px;
                left: ${i * 4}px;
                width: 192px;
                height: 48px;
                border-radius: 8px;
                border: 1px solid var(--border);
                background: var(--card);
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              `;
              root.appendChild(card);
            }

            // Badge with count
            const badge = document.createElement("div");
            badge.textContent = `${items.length} items`;
            badge.style.cssText = `
              position: absolute;
              top: -6px;
              right: -6px;
              background: var(--primary);
              color: var(--primary-foreground);
              font-size: 11px;
              font-weight: 600;
              padding: 2px 8px;
              border-radius: 10px;
              white-space: nowrap;
            `;
            root.appendChild(badge);

            container.appendChild(root);
          },
        });
      },
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
