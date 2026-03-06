// Offline persistence for Yjs documents using IndexedDB.
// Stores Y.Doc state locally so users can work offline and sync
// when reconnected. Uses y-indexeddb for efficient binary storage.
import { useEffect, useRef, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import type * as Y from "yjs";

export function useYjsOffline(doc: Y.Doc | null, documentId: string) {
  const persistenceRef = useRef<IndexeddbPersistence | null>(null);
  const [idbSynced, setIdbSynced] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setIdbSynced(false);

    const idbName = `referencer-yjs-${documentId}`;
    const persistence = new IndexeddbPersistence(idbName, doc);
    persistenceRef.current = persistence;

    persistence.on("synced", () => {
      console.log(`[yjs-offline] IndexedDB synced for document: ${documentId}`);
      setIdbSynced(true);
    });

    persistence.on("error", (err: unknown) => {
      console.error(`[yjs-offline] IndexedDB error for document ${documentId}:`, err);
      // On error, allow seeding to proceed so the app isn't stuck
      setIdbSynced(true);
    });

    return () => {
      persistence.destroy();
      persistenceRef.current = null;
      setIdbSynced(false);
    };
  }, [doc, documentId]);

  return { idbSynced };
}
