import { useEffect, useState, useCallback } from "react";
import { useDocument } from "@/contexts/DocumentContext";

export interface LineHeightOption {
  label: string;
  value: number;
}

export const LINE_HEIGHT_OPTIONS: LineHeightOption[] = [
  { label: "Compact", value: 1.2 },
  { label: "Normal", value: 1.6 },
  { label: "Relaxed", value: 1.8 },
  { label: "Loose", value: 2.0 },
];

const DEFAULT_LINE_HEIGHT = 1.6;

function isValidLineHeight(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function useLineHeight() {
  const { yjs } = useDocument();
  const [lineHeight, setLineHeightState] = useState(DEFAULT_LINE_HEIGHT);

  // Sync from Yjs document-meta map
  useEffect(() => {
    if (!yjs.doc) return;
    const meta = yjs.doc.getMap("document-meta");
    const existing = meta.get("lineHeight");
    if (isValidLineHeight(existing)) {
      setLineHeightState(existing);
    }
    const observer = () => {
      const lh = meta.get("lineHeight");
      if (isValidLineHeight(lh)) {
        setLineHeightState(lh);
      }
    };
    meta.observe(observer);
    return () => meta.unobserve(observer);
  }, [yjs.doc]);

  // Apply CSS variable whenever lineHeight changes; clean up on unmount
  useEffect(() => {
    document.documentElement.style.setProperty("--editor-line-height", String(lineHeight));
    return () => {
      document.documentElement.style.removeProperty("--editor-line-height");
    };
  }, [lineHeight]);

  const setLineHeight = useCallback(
    (value: number) => {
      if (!isValidLineHeight(value)) return;
      const meta = yjs.doc?.getMap("document-meta");
      meta?.set("lineHeight", value);
      setLineHeightState(value);
    },
    [yjs.doc],
  );

  return { lineHeight, setLineHeight };
}
