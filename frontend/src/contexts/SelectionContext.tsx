import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { DragItemType } from "@/hooks/ui/use-hub-dnd";

export interface DragItem {
  type: DragItemType;
  id: string;
}

interface SelectionContextValue {
  selectedIds: Set<string>;
  lastClickedId: string | null;
  isSelectionActive: boolean;
  handleItemClick: (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: () => DragItem[];
}

const SelectionContext = createContext<SelectionContextValue>({
  selectedIds: new Set(),
  lastClickedId: null,
  isSelectionActive: false,
  handleItemClick: () => {},
  clearSelection: () => {},
  isSelected: () => false,
  getSelectedItems: () => [],
});

interface SelectionProviderProps {
  orderedIds: string[];
  /** Map of id -> DragItemType for building typed DragItem arrays */
  itemTypes: Map<string, DragItemType>;
  children: ReactNode;
}

export function SelectionProvider({ orderedIds, itemTypes, children }: SelectionProviderProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);

  // Auto-prune: remove selected IDs no longer in orderedIds
  useEffect(() => {
    setSelectedIds((prev) => {
      const orderedSet = new Set(orderedIds);
      const pruned = new Set([...prev].filter((id) => orderedSet.has(id)));
      if (pruned.size === prev.size) return prev;
      return pruned;
    });
  }, [orderedIds]);

  const isSelectionActive = selectedIds.size > 0;

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastClickedId(null);
  }, []);

  const handleItemClick = useCallback(
    (id: string, event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      if (isShift && lastClickedId !== null) {
        // Range select from anchor to clicked id
        const anchorIdx = orderedIds.indexOf(lastClickedId);
        const clickIdx = orderedIds.indexOf(id);
        if (anchorIdx === -1) {
          // Anchor not found, fall back to single select
          setSelectedIds(new Set([id]));
          setLastClickedId(id);
          return;
        }
        const start = Math.min(anchorIdx, clickIdx);
        const end = Math.max(anchorIdx, clickIdx);
        const rangeIds = orderedIds.slice(start, end + 1);
        setSelectedIds(new Set(rangeIds));
        // Don't update lastClickedId on shift-click (anchor stays stable)
      } else if (isCtrlOrCmd) {
        // Toggle
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
        setLastClickedId(id);
      } else {
        // Plain click
        if (isSelectionActive) {
          // Selection mode active: toggle this item
          setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
              next.delete(id);
            } else {
              next.add(id);
            }
            return next;
          });
        } else {
          // Nothing selected: select this item
          setSelectedIds(new Set([id]));
        }
        setLastClickedId(id);
      }
    },
    [lastClickedId, orderedIds, isSelectionActive],
  );

  const getSelectedItems = useCallback((): DragItem[] => {
    return [...selectedIds]
      .map((id) => {
        const type = itemTypes.get(id);
        if (!type) return null;
        return { type, id };
      })
      .filter((item): item is DragItem => item !== null);
  }, [selectedIds, itemTypes]);

  const value = useMemo(
    () => ({
      selectedIds,
      lastClickedId,
      isSelectionActive,
      handleItemClick,
      clearSelection,
      isSelected,
      getSelectedItems,
    }),
    [
      selectedIds,
      lastClickedId,
      isSelectionActive,
      handleItemClick,
      clearSelection,
      isSelected,
      getSelectedItems,
    ],
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSelection() {
  return useContext(SelectionContext);
}
