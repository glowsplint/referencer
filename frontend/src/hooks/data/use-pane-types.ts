import { useState, useEffect, useCallback } from "react";
import type * as Y from "yjs";
import type { PaneContentType, PaneMetadata } from "@/types/editor";

export function usePaneTypes(doc: Y.Doc | null) {
  const [paneTypes, setPaneTypes] = useState<Record<number, PaneMetadata>>({});

  useEffect(() => {
    if (!doc) return;
    const map = doc.getMap<PaneMetadata>("pane-meta");

    const update = () => {
      const result: Record<number, PaneMetadata> = {};
      map.forEach((value, key) => {
        const index = Number(key);
        if (!isNaN(index)) result[index] = value;
      });
      setPaneTypes(result);
    };

    update();
    map.observe(update);
    return () => map.unobserve(update);
  }, [doc]);

  const setPaneType = useCallback(
    (index: number, type: PaneContentType, meta?: { storageKey?: string; filename?: string }) => {
      if (!doc) return;
      const map = doc.getMap<PaneMetadata>("pane-meta");
      doc.transact(() => {
        map.set(String(index), { type, ...meta });
      });
    },
    [doc],
  );

  const clearPaneType = useCallback(
    (index: number) => {
      if (!doc) return;
      const map = doc.getMap<PaneMetadata>("pane-meta");
      doc.transact(() => {
        map.delete(String(index));
      });
    },
    [doc],
  );

  return { paneTypes, setPaneType, clearPaneType };
}
