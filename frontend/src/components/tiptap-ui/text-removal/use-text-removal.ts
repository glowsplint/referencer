import { useState, useCallback, useEffect, useRef } from "react";
import { type Editor } from "@tiptap/core";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { textRemovalPreviewPluginKey } from "@/lib/tiptap/extensions/text-removal-preview";
import {
  findFilteredMatches,
  deleteMatchRanges,
  compilePattern,
} from "@/lib/tiptap/text-removal-matching";
import type { MatchRange } from "@/lib/tiptap/text-removal-matching";

export type { MatchRange };

export function useTextRemoval(editor: Editor | null) {
  // Filter state
  const [selectedMarks, setSelectedMarks] = useState<string[]>([]);
  const [pattern, setPatternState] = useState<string>("*");
  const [isRegex, setIsRegex] = useState(false);
  const [patternError, setPatternError] = useState<string | null>(null);

  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Matches
  const [matches, setMatches] = useState<MatchRange[]>([]);

  // Ref to track if mounted (for cleanup)
  const editorRef = useRef(editor);
  editorRef.current = editor;

  // --- Clearing decorations ---

  const clearDecorations = useCallback(() => {
    if (!editor) return;
    editor.view.dispatch(editor.state.tr.setMeta(textRemovalPreviewPluginKey, DecorationSet.empty));
  }, [editor]);

  // --- Filter actions ---

  const toggleMark = useCallback((mark: string) => {
    setSelectedMarks((prev) =>
      prev.includes(mark) ? prev.filter((m) => m !== mark) : [...prev, mark],
    );
  }, []);

  const setPattern = useCallback((p: string) => {
    setPatternState(p);
    setPatternError(null);
  }, []);

  const toggleRegex = useCallback(() => {
    setIsRegex((prev) => !prev);
  }, []);

  // --- Dialog actions ---

  const openDialog = useCallback(() => {
    setIsOpen(true);
    setSelectedMarks([]);
    setPatternState("*");
    setIsRegex(false);
    setPatternError(null);
    setShowConfirmation(false);
    setMatches([]);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowConfirmation(false);
    setSelectedMarks([]);
    setPatternState("*");
    setIsRegex(false);
    setPatternError(null);
    setMatches([]);
    clearDecorations();
  }, [clearDecorations]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // --- Confirmation actions ---

  const requestRemoval = useCallback(() => {
    setShowConfirmation(true);
  }, []);

  const cancelRemoval = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const confirmRemoval = useCallback(() => {
    if (!editor) return;

    // Re-run match calculation for fresh positions (collab safety)
    const freshMatches = findFilteredMatches(editor.state.doc, {
      selectedMarks,
      pattern,
      isRegex,
    });

    deleteMatchRanges(editor, freshMatches);
    // Close dialog clears decorations and resets state
    setIsOpen(false);
    setIsMinimized(false);
    setShowConfirmation(false);
    setSelectedMarks([]);
    setPatternState("*");
    setIsRegex(false);
    setPatternError(null);
    setMatches([]);
    // Clear decorations directly since closeDialog callback may have stale editor ref
    editor.view.dispatch(editor.state.tr.setMeta(textRemovalPreviewPluginKey, DecorationSet.empty));
  }, [editor, selectedMarks, pattern, isRegex]);

  // --- Debounced match calculation + decoration update ---

  useEffect(() => {
    if (!editor || !isOpen) return;

    const timer = setTimeout(() => {
      // Validate pattern
      const compiled = compilePattern(pattern, isRegex);
      if (!compiled) {
        setPatternError("Invalid pattern");
        setMatches([]);
        clearDecorations();
        return;
      }

      setPatternError(null);

      // Find matches
      const filter = { selectedMarks, pattern, isRegex };
      const found = findFilteredMatches(editor.state.doc, filter);
      setMatches(found);

      // Create decorations
      const decorations = found.map((match) =>
        Decoration.inline(match.from, match.to, {
          style:
            "background-color: rgba(239, 68, 68, 0.2); text-decoration: line-through; text-decoration-color: rgb(239, 68, 68);",
          class: "text-removal-preview",
        }),
      );

      const decorationSet = DecorationSet.create(editor.state.doc, decorations);
      editor.view.dispatch(editor.state.tr.setMeta(textRemovalPreviewPluginKey, decorationSet));
    }, 150);

    return () => clearTimeout(timer);
  }, [editor, selectedMarks, pattern, isRegex, isOpen, clearDecorations]);

  // --- Cleanup on unmount ---

  useEffect(() => {
    return () => {
      const ed = editorRef.current;
      if (!ed) return;
      try {
        ed.view.dispatch(ed.state.tr.setMeta(textRemovalPreviewPluginKey, DecorationSet.empty));
      } catch {
        // Editor may already be destroyed
      }
    };
  }, []);

  // --- Computed values ---

  const matchCount = matches.length;

  return {
    // Filter state
    selectedMarks,
    toggleMark,
    pattern,
    setPattern,
    isRegex,
    toggleRegex,
    patternError,

    // Matches
    matches,
    matchCount,

    // Dialog state
    isOpen,
    openDialog,
    closeDialog,
    isMinimized,
    toggleMinimize,

    // Confirmation
    showConfirmation,
    requestRemoval,
    confirmRemoval,
    cancelRemoval,
  };
}
