// Individual editor pane component. Wraps a Tiptap editor instance with
// all decoration hooks (highlights, underlines, word hover, selection,
// arrows) and forwards mouse events for word-level click/drag selection
// in locked mode. Each pane represents one text in the document.
// When a Yjs fragment is provided, enables real-time collaborative editing.
"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import type * as Y from "yjs";

import { createSimpleEditorExtensions } from "./extensions";
import { useUnifiedDecorations } from "@/hooks/annotations/use-unified-decorations";
import { useLayerUnderlineDecorations } from "@/hooks/annotations/use-layer-underline-decorations";
import { useSelectionHighlight } from "@/hooks/annotations/use-selection-highlight";
import { useSimilarTextHighlight } from "@/hooks/annotations/use-similar-text-highlight";
import { useSelectionScroll } from "@/hooks/selection/use-selection-decoration";
import { useWordHover } from "@/hooks/selection/use-word-hover";
import { useEditorArrows } from "@/hooks/annotations/use-editor-arrows";
import { useArrowCleanup } from "@/hooks/annotations/use-arrow-cleanup";
import { usePrintRefDecorations } from "@/hooks/annotations/use-print-ref-decorations";
import { SelectionRingOverlay } from "@/components/SelectionRingOverlay";
import type { ActiveTool, Layer, WordSelection } from "@/types/editor";

// --- Node SCSS ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/table-node/table-node.scss";

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss";

export function EditorPane({
  isLocked,
  activeTool,
  content,
  index,
  fragment,
  onEditorMount,
  onFocus,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  layers,
  selection,
  selectionHidden,
  activeLayerColor,
  isDarkMode,
  removeArrow,
  sectionVisibility,
  selectedArrowId,
  yjsSynced,
  overscroll,
}: {
  isLocked: boolean;
  activeTool?: ActiveTool;
  content?: Record<string, unknown>;
  index: number;
  fragment?: Y.XmlFragment | null;
  onEditorMount: (index: number, editor: Editor) => void;
  onFocus: (index: number) => void;
  onMouseDown?: (e: React.MouseEvent, editor: Editor, editorIndex: number) => void;
  onMouseMove?: (e: React.MouseEvent, editor: Editor, editorIndex: number) => void;
  onMouseUp?: (e: React.MouseEvent, editor: Editor, editorIndex: number) => void;
  layers: Layer[];
  selection: WordSelection | null;
  selectionHidden?: boolean;
  activeLayerColor: string | null;
  isDarkMode: boolean;
  removeArrow: (layerId: string, arrowId: string) => void;
  sectionVisibility: boolean[];
  selectedArrowId: string | null;
  yjsSynced?: boolean;
  overscroll?: boolean;
}) {
  const extensions = useMemo(
    () => createSimpleEditorExtensions({ fragment: fragment ?? undefined }),
    // Fragment identity is stable per editor pane lifecycle

    [fragment],
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Track whether initial content has been seeded into the Yjs fragment.
  // Starts false; the seeding effect gates on fragment being available.
  const contentSeededRef = useRef(false);

  const editor = useEditor(
    {
      immediatelyRender: false,
      editorProps: {
        attributes: {
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "off",
          "aria-label": "Content area, start typing to enter text.",
          class: "simple-editor",
        },
        handlePaste: (view, event) => {
          const items = event.clipboardData?.items;
          if (!items) return false;
          // Handle .docx file paste
          for (const item of items) {
            if (
              item.type ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) return false;
              file.arrayBuffer().then(async (buffer) => {
                const mammoth = await import("mammoth");
                const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                const { cleanPastedHtml } = await import("@/lib/tiptap/paste-html-cleaner");
                const cleaned = cleanPastedHtml(result.value);
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = cleaned;
                const { DOMParser: PmDOMParser } = await import("@tiptap/pm/model");
                const slice = PmDOMParser.fromSchema(view.state.schema).parseSlice(tempDiv);
                view.dispatch(view.state.tr.replaceSelection(slice));
              });
              return true;
            }
          }
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) return false;
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (!src) return;
                const { state, dispatch } = view;
                const node = state.schema.nodes.image?.create({ src });
                if (node) dispatch(state.tr.replaceSelectionWith(node));
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
          return false;
        },
        handleDrop: (view, event) => {
          const files = event.dataTransfer?.files;
          if (!files?.length) return false;
          // Handle .docx file drop
          for (const file of files) {
            if (
              file.name.endsWith(".docx") ||
              file.type ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ) {
              event.preventDefault();
              file.arrayBuffer().then(async (buffer) => {
                const mammoth = await import("mammoth");
                const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                const { cleanPastedHtml } = await import("@/lib/tiptap/paste-html-cleaner");
                const cleaned = cleanPastedHtml(result.value);
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = cleaned;
                const { DOMParser: PmDOMParser } = await import("@tiptap/pm/model");
                const slice = PmDOMParser.fromSchema(view.state.schema).parseSlice(tempDiv);
                const pos = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (pos) {
                  view.dispatch(view.state.tr.insert(pos.pos, slice.content));
                } else {
                  view.dispatch(view.state.tr.replaceSelection(slice));
                }
              });
              return true;
            }
          }
          for (const file of files) {
            if (file.type.startsWith("image/")) {
              event.preventDefault();
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (!src) return;
                const { state, dispatch } = view;
                const node = state.schema.nodes.image?.create({ src });
                if (node) dispatch(state.tr.replaceSelectionWith(node));
              };
              reader.readAsDataURL(file);
              return true;
            }
          }
          return false;
        },
      },
      extensions,
      // Only provide content when NOT using Yjs (Yjs manages content via fragment)
      content: fragment ? undefined : content,
    },
    [extensions],
  );

  // Seed default content into an empty Yjs fragment after sync
  useEffect(() => {
    if (!fragment || !editor || contentSeededRef.current) return;
    // Wait for Yjs sync before checking emptiness to avoid overwriting server content
    if (yjsSynced === false) return;
    contentSeededRef.current = true;
    if (fragment.length === 0 && content) {
      editor.commands.setContent(content);
    }
  }, [fragment, editor, content, yjsSynced]);

  useEffect(() => {
    if (editor) {
      onEditorMount(index, editor);
    }
  }, [editor, index, onEditorMount]);

  useLayoutEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked);
      if (!isLocked) {
        editor.emit("selectionUpdate", { editor, transaction: editor.state.tr });
      }
    }
  }, [editor, isLocked]);

  const visibleSelection = selectionHidden ? null : selection;

  useUnifiedDecorations(editor, layers, index, isLocked, isDarkMode);
  useLayerUnderlineDecorations(editor, layers, index, isLocked, isDarkMode);
  useSelectionHighlight(
    editor,
    visibleSelection,
    index,
    isLocked,
    activeLayerColor,
    isDarkMode,
    activeTool,
  );
  useSimilarTextHighlight(editor, visibleSelection, index, isLocked, activeLayerColor, isDarkMode);
  useWordHover(editor, index, isLocked, isDarkMode, visibleSelection, activeLayerColor, layers);
  useEditorArrows(
    editor,
    layers,
    index,
    isLocked,
    isDarkMode,
    sectionVisibility,
    removeArrow,
    selectedArrowId,
  );
  useArrowCleanup({ editor, editorIndex: index, layers, removeArrow, isLocked });
  usePrintRefDecorations(editor, layers, index, sectionVisibility);
  useSelectionScroll(editor, visibleSelection, index, wrapperRef);

  const handleFocus = useCallback(() => {
    onFocus(index);
  }, [index, onFocus]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !editor) return;
      onFocus(index);
      onMouseDown?.(e, editor, index);
    },
    [isLocked, editor, index, onFocus, onMouseDown],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !editor) return;
      onMouseMove?.(e, editor, index);
    },
    [isLocked, editor, index, onMouseMove],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !editor) return;
      onMouseUp?.(e, editor, index);
    },
    [isLocked, editor, index, onMouseUp],
  );

  return (
    <div
      ref={wrapperRef}
      className={`simple-editor-wrapper${isLocked ? " editor-locked" : ""}${isLocked && activeTool === "arrow" ? " arrow-mode" : ""}${isLocked && activeTool === "eraser" ? " eraser-mode" : ""}${isLocked && activeTool === "highlight" ? " highlight-mode" : ""}${isLocked && activeTool === "comments" ? " comment-mode" : ""}${overscroll ? " editor-overscroll" : ""}`}
      onFocusCapture={handleFocus}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <EditorContent editor={editor} role="presentation" className="simple-editor-content" />
      <SelectionRingOverlay
        editor={editor}
        selection={visibleSelection}
        editorIndex={index}
        isLocked={isLocked}
        isDarkMode={isDarkMode}
        wrapperRef={wrapperRef}
      />
    </div>
  );
}
