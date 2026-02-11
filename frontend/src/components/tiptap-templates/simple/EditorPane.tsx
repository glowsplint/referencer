"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import type { Editor } from "@tiptap/react"

import { createSimpleEditorExtensions } from "./extensions"
import { useLayerDecorations } from "@/hooks/use-layer-decorations"
import { useSelectionDecoration } from "@/hooks/use-selection-decoration"
import { AnnotationMargin } from "@/components/AnnotationMargin"
import type { Layer, WordSelection, EditingAnnotation } from "@/types/editor"

// --- Node SCSS ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

export function EditorPane({
  isLocked,
  content,
  index,
  onEditorMount,
  onFocus,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  layers,
  selection,
  editingAnnotation,
  onAnnotationChange,
  onAnnotationBlur,
  onAnnotationClick,
}: {
  isLocked: boolean
  content?: Record<string, unknown>
  index: number
  onEditorMount: (index: number, editor: Editor) => void
  onFocus: (index: number) => void
  onMouseDown?: (e: React.MouseEvent, editor: Editor, editorIndex: number) => void
  onMouseMove?: (e: React.MouseEvent, editor: Editor, editorIndex: number) => void
  onMouseUp?: (e: React.MouseEvent, editor: Editor, editorIndex: number) => void
  layers: Layer[]
  selection: WordSelection | null
  editingAnnotation: EditingAnnotation | null
  onAnnotationChange?: (layerId: string, highlightId: string, annotation: string) => void
  onAnnotationBlur?: () => void
  onAnnotationClick?: (layerId: string, highlightId: string) => void
}) {
  const [extensions] = useState(() => createSimpleEditorExtensions())
  const wrapperRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions,
    content,
  })

  useEffect(() => {
    if (editor) {
      onEditorMount(index, editor)
    }
  }, [editor, index, onEditorMount])

  useLayoutEffect(() => {
    if (editor) {
      editor.setEditable(!isLocked)
      if (!isLocked) {
        editor.emit("selectionUpdate", { editor, transaction: editor.state.tr })
      }
    }
  }, [editor, isLocked])

  useLayerDecorations(editor, layers, index, isLocked)
  const selectionRect = useSelectionDecoration(editor, selection, index, wrapperRef)

  const handleFocus = useCallback(() => {
    onFocus(index)
  }, [index, onFocus])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !editor) return
      onMouseDown?.(e, editor, index)
    },
    [isLocked, editor, index, onMouseDown]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !editor) return
      onMouseMove?.(e, editor, index)
    },
    [isLocked, editor, index, onMouseMove]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !editor) return
      onMouseUp?.(e, editor, index)
    },
    [isLocked, editor, index, onMouseUp]
  )

  return (
    <div
      ref={wrapperRef}
      className={`simple-editor-wrapper${isLocked ? " editor-locked" : ""}`}
      onFocusCapture={handleFocus}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <EditorContent
        editor={editor}
        role="presentation"
        className="simple-editor-content"
      />
      {selectionRect && (
        <div
          className="word-selection"
          style={{
            position: "absolute",
            top: selectionRect.top,
            left: selectionRect.left,
            width: selectionRect.width,
            height: selectionRect.height,
            pointerEvents: "none",
          }}
        />
      )}
      {isLocked && (
        <AnnotationMargin
          editor={editor}
          editorIndex={index}
          layers={layers}
          wrapperRef={wrapperRef}
          editingAnnotation={editingAnnotation}
          onAnnotationChange={onAnnotationChange}
          onAnnotationBlur={onAnnotationBlur}
          onAnnotationClick={onAnnotationClick}
        />
      )}
    </div>
  )
}
