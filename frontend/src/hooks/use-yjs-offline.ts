// Offline persistence for Yjs documents using IndexedDB.
// Stores Y.Doc state locally so users can work offline and sync
// when reconnected. Uses y-indexeddb for efficient binary storage.
import { useEffect, useRef } from "react"
import { IndexeddbPersistence } from "y-indexeddb"
import type * as Y from "yjs"

export function useYjsOffline(doc: Y.Doc | null, workspaceId: string) {
  const persistenceRef = useRef<IndexeddbPersistence | null>(null)

  useEffect(() => {
    if (!doc) return

    const idbName = `referencer-yjs-${workspaceId}`
    const persistence = new IndexeddbPersistence(idbName, doc)
    persistenceRef.current = persistence

    persistence.on("synced", () => {
      console.log(`[yjs-offline] IndexedDB synced for workspace: ${workspaceId}`)
    })

    persistence.on("error", (err: unknown) => {
      console.error(`[yjs-offline] IndexedDB error for workspace ${workspaceId}:`, err)
    })

    return () => {
      persistence.destroy()
      persistenceRef.current = null
    }
  }, [doc, workspaceId])
}
