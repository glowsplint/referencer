import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface DndState {
  isDragging: boolean;
  dragType: "workspace" | "folder" | null;
  dragId: string | null;
  overTargetId: string | null;
}

interface DndContextValue extends DndState {
  setDragState: (state: Partial<DndState>) => void;
  resetDrag: () => void;
}

const initialState: DndState = {
  isDragging: false,
  dragType: null,
  dragId: null,
  overTargetId: null,
};

const DndContext = createContext<DndContextValue>({
  ...initialState,
  setDragState: () => {},
  resetDrag: () => {},
});

export function DndProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DndState>(initialState);

  const setDragState = useCallback((partial: Partial<DndState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetDrag = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <DndContext.Provider value={{ ...state, setDragState, resetDrag }}>
      {children}
    </DndContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDndContext() {
  return useContext(DndContext);
}
