// Manages annotation editing state: which annotation is being edited,
// the pre-edit content for undo, and blur/click handlers.

import { useState, useCallback, useRef } from "react";
import { isAnnotationEmpty } from "@/lib/is-annotation-empty";
import type { EditingAnnotation, Layer } from "@/types/editor";

interface UseAnnotationEditArgs {
  layers: Layer[];
  removeHighlight: (layerId: string, highlightId: string) => void;
  updateHighlightAnnotation: (layerId: string, highlightId: string, annotation: string) => void;
  history: {
    record: (cmd: {
      type: string;
      description: string;
      details?: { label: string; before?: string; after?: string }[];
      undo: () => void;
      redo: () => void;
    }) => void;
  };
}

export function useAnnotationEdit({
  layers,
  removeHighlight,
  updateHighlightAnnotation,
  history,
}: UseAnnotationEditArgs) {
  const [editingAnnotation, setEditingAnnotation] = useState<EditingAnnotation | null>(null);
  const annotationBeforeEditRef = useRef<string>("");

  const handleAnnotationBlur = useCallback(
    (layerId: string, highlightId: string, annotation: string) => {
      if (isAnnotationEmpty(annotation)) {
        removeHighlight(layerId, highlightId);
      } else {
        const oldText = annotationBeforeEditRef.current;
        if (oldText !== annotation) {
          const truncated = (s: string) => (s.length > 80 ? s.slice(0, 80) + "..." : s);
          history.record({
            type: "updateAnnotation",
            description: `Updated annotation to '${truncated(annotation)}'`,
            details: [
              { label: "annotation", before: truncated(oldText), after: truncated(annotation) },
            ],
            undo: () => {
              updateHighlightAnnotation(layerId, highlightId, oldText);
            },
            redo: () => {
              updateHighlightAnnotation(layerId, highlightId, annotation);
            },
          });
        }
      }
      setEditingAnnotation(null);
    },
    [removeHighlight, history, updateHighlightAnnotation],
  );

  const handleAnnotationClick = useCallback(
    (layerId: string, highlightId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      const highlight = layer?.highlights.find((h) => h.id === highlightId);
      annotationBeforeEditRef.current = highlight?.annotation ?? "";
      setEditingAnnotation({ layerId, highlightId });
    },
    [layers],
  );

  /** Called by comment mode when a new highlight is created for editing. */
  const onHighlightAdded = useCallback((layerId: string, highlightId: string) => {
    annotationBeforeEditRef.current = "";
    setEditingAnnotation({ layerId, highlightId });
  }, []);

  return {
    editingAnnotation,
    handleAnnotationBlur,
    handleAnnotationClick,
    onHighlightAdded,
  };
}
