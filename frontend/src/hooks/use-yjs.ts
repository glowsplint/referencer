// React hook for managing a Yjs workspace provider.
// Creates and tears down Y.Doc + WebsocketProvider per workspace ID.
// Provides XmlFragments for editor panes and connection status.
import { useEffect, useRef, useState, useCallback } from "react"
import { createWorkspaceProvider, type WorkspaceProvider } from "@/lib/yjs/provider"

export function useYjs(workspaceId: string) {
  const providerRef = useRef<WorkspaceProvider | null>(null)
  const [connected, setConnected] = useState(false)
  const [synced, setSynced] = useState(false)

  // Create provider once per workspace ID
  useEffect(() => {
    const provider = createWorkspaceProvider(workspaceId)
    providerRef.current = provider

    const onStatus = ({ status }: { status: string }) => {
      setConnected(status === "connected")
    }
    const onSync = (isSynced: boolean) => {
      setSynced(isSynced)
    }
    provider.wsProvider.on("status", onStatus)
    provider.wsProvider.on("sync", onSync)

    // When the WebSocket connection fails (no collab server), treat the
    // local Y.Doc as synced so content seeding can proceed immediately.
    let connectionAttempted = false
    const onConnectionError = () => {
      if (connectionAttempted) return
      connectionAttempted = true
      setSynced((prev) => prev || true)
    }
    provider.wsProvider.on("connection-error", onConnectionError)
    provider.wsProvider.on("connection-close", onConnectionError)

    return () => {
      provider.wsProvider.off("connection-error", onConnectionError)
      provider.wsProvider.off("connection-close", onConnectionError)
      provider.wsProvider.off("status", onStatus)
      provider.wsProvider.off("sync", onSync)
      provider.destroy()
      providerRef.current = null
      setConnected(false)
      setSynced(false)
    }
  }, [workspaceId])

  const getFragment = useCallback(
    (index: number) => providerRef.current?.getFragment(index) ?? null,
    []
  )

  return {
    provider: providerRef.current,
    wsProvider: providerRef.current?.wsProvider ?? null,
    doc: providerRef.current?.doc ?? null,
    connected,
    synced,
    getFragment,
    awareness: providerRef.current?.awareness ?? null,
  }
}
