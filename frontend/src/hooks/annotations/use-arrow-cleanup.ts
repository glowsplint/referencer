// Automatically removes arrows when the text at their anchor or target
// endpoint is deleted or changed in the editor. Listens to ProseMirror
// transactions and checks if stored endpoint text still matches the
// document content at the stored positions.
import { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import type { Layer } from "@/types/editor";

interface UseArrowCleanupOptions {
  editor: Editor | null;
  editorIndex: number;
  layers: Layer[];
  removeArrow: (layerId: string, arrowId: string) => void;
}

/**
 * Watches for editor content changes and removes arrows whose endpoint
 * text no longer matches the document content at the stored positions.
 */
export function useArrowCleanup({
  editor,
  editorIndex,
  layers,
  removeArrow,
}: UseArrowCleanupOptions) {
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const removeArrowRef = useRef(removeArrow);
  removeArrowRef.current = removeArrow;

  // Debounce timer to avoid checking on every keystroke
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleTransaction = ({ transaction }: { transaction: { docChanged: boolean } }) => {
      if (!transaction.docChanged) return;

      // Debounce: wait for typing to settle before checking
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        checkArrowEndpoints(editor, editorIndex, layersRef.current, removeArrowRef.current);
      }, 300);
    };

    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editor, editorIndex]);
}

/**
 * Check all arrow endpoints in the given editor and remove arrows
 * whose stored text no longer matches the document content.
 */
function checkArrowEndpoints(
  editor: Editor,
  editorIndex: number,
  layers: Layer[],
  removeArrow: (layerId: string, arrowId: string) => void,
) {
  if (editor.isDestroyed) return;
  const doc = editor.state.doc;
  const docSize = doc.content.size;

  for (const layer of layers) {
    for (const arrow of layer.arrows) {
      let shouldRemove = false;

      // Check the "from" endpoint if it belongs to this editor
      if (arrow.from.editorIndex === editorIndex) {
        if (!endpointTextMatches(doc, docSize, arrow.from.from, arrow.from.to, arrow.from.text)) {
          shouldRemove = true;
        }
      }

      // Check the "to" endpoint if it belongs to this editor
      if (!shouldRemove && arrow.to.editorIndex === editorIndex) {
        if (!endpointTextMatches(doc, docSize, arrow.to.from, arrow.to.to, arrow.to.text)) {
          shouldRemove = true;
        }
      }

      if (shouldRemove) {
        removeArrow(layer.id, arrow.id);
      }
    }
  }
}

/**
 * Returns true if the text in the document at [from, to) matches the expected text.
 * Returns false if positions are out of range or text doesn't match.
 */
function endpointTextMatches(
  doc: { textBetween: (from: number, to: number) => string; content: { size: number } },
  docSize: number,
  from: number,
  to: number,
  expectedText: string,
): boolean {
  // Positions out of range means the text was deleted
  if (from < 0 || to < 0 || from >= docSize || to > docSize || from >= to) {
    return false;
  }
  try {
    const currentText = doc.textBetween(from, to);
    return currentText === expectedText;
  } catch {
    // Position invalid (e.g., inside a deleted node)
    return false;
  }
}

// Export for testing
export { checkArrowEndpoints, endpointTextMatches };
