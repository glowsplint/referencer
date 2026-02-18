// React hook for managing a Yjs workspace provider.
// Creates and tears down Y.Doc + WebsocketProvider per workspace ID.
// Provides XmlFragments for editor panes and connection status.
import { useEffect, useRef, useState, useCallback } from "react"
import { createWorkspaceProvider, type WorkspaceProvider } from "@/lib/yjs/provider"

export function useYjs(workspaceId: string) {
  const providerRef = useRef<WorkspaceProvider | null>(null)
  const [connected, setConnected] = useState(false)

  // Create provider once per workspace ID
  useEffect(() => {
    const provider = createWorkspaceProvider(workspaceId)
    providerRef.current = provider

    const onStatus = ({ status }: { status: string }) => {
      setConnected(status === "connected")
    }
    provider.wsProvider.on("status", onStatus)

    return () => {
      provider.wsProvider.off("status", onStatus)
      provider.destroy()
      providerRef.current = null
      setConnected(false)
    }
  }, [workspaceId])

  const getFragment = useCallback(
    (index: number) => providerRef.current?.getFragment(index) ?? null,
    []
  )

  return {
    provider: providerRef.current,
    doc: providerRef.current?.doc ?? null,
    connected,
    getFragment,
    awareness: providerRef.current?.awareness ?? null,
  }
}
