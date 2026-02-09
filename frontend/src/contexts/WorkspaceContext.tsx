import { createContext, useContext } from "react"
import type { useEditorWorkspace } from "@/hooks/use-editor-workspace"

export type WorkspaceContextValue = ReturnType<typeof useEditorWorkspace>

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({
  value,
  children,
}: {
  value: WorkspaceContextValue
  children: React.ReactNode
}) {
  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return ctx
}
