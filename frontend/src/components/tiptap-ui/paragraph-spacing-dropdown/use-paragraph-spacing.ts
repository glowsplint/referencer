import { useEffect, useState, useCallback } from "react";
import { useDocument } from "@/contexts/DocumentContext";

export interface ParagraphSpacingOption {
  label: string;
  value: string;
}

export const PARAGRAPH_SPACING_OPTIONS: ParagraphSpacingOption[] = [
  { label: "Normal", value: "20px" },
  { label: "Compact", value: "10px" },
  { label: "Tight", value: "4px" },
];

const DEFAULT_PARAGRAPH_SPACING = "20px";

function isValidParagraphSpacing(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function useParagraphSpacing() {
  const { yjs } = useDocument();
  const [paragraphSpacing, setParagraphSpacingState] = useState(DEFAULT_PARAGRAPH_SPACING);

  // Sync from Yjs document-meta map
  useEffect(() => {
    if (!yjs.doc) return;
    const meta = yjs.doc.getMap("document-meta");
    const existing = meta.get("paragraphSpacing");
    if (isValidParagraphSpacing(existing)) {
      setParagraphSpacingState(existing);
    }
    const observer = () => {
      const ps = meta.get("paragraphSpacing");
      if (isValidParagraphSpacing(ps)) {
        setParagraphSpacingState(ps);
      }
    };
    meta.observe(observer);
    return () => meta.unobserve(observer);
  }, [yjs.doc]);

  // Apply CSS variable whenever paragraphSpacing changes; clean up on unmount
  useEffect(() => {
    document.documentElement.style.setProperty("--editor-paragraph-spacing", paragraphSpacing);
    return () => {
      document.documentElement.style.removeProperty("--editor-paragraph-spacing");
    };
  }, [paragraphSpacing]);

  const setParagraphSpacing = useCallback(
    (value: string) => {
      if (!isValidParagraphSpacing(value)) return;
      const meta = yjs.doc?.getMap("document-meta");
      meta?.set("paragraphSpacing", value);
      setParagraphSpacingState(value);
    },
    [yjs.doc],
  );

  return { paragraphSpacing, setParagraphSpacing };
}
