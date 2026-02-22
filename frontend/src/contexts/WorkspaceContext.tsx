// React context that provides the workspace state (layers, editors, settings,
// actions) to all descendant components. Typed from the useEditorWorkspace hook
// return value so consumers get full type safety without prop-drilling.
import { createContext, useContext } from "react";
import type { useEditorWorkspace } from "@/hooks/data/use-editor-workspace";

export type WorkspaceContextValue = ReturnType<typeof useEditorWorkspace>;

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue;
  children: React.ReactNode;
}) {
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
