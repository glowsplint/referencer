"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import type { Editor } from "@tiptap/react"

import { createSimpleEditorExtensions } from "./extensions"
import { getWordBoundaries } from "@/lib/tiptap/word-boundaries"
import { useLayerDecorations } from "@/hooks/use-layer-decorations"
import { useSelectionDecoration } from "@/hooks/use-selection-decoration"
import type { Layer, WordSelection } from "@/types/editor"

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
  onWordClick,
  onNonWordClick,
  layers,
  selection,
  isLayersOn,
}: {
  isLocked: boolean
  content?: Record<string, unknown>
  index: number
  onEditorMount: (index: number, editor: Editor) => void
  onFocus: (index: number) => void
  onWordClick?: (editorIndex: number, from: number, to: number, text: string) => void
  onNonWordClick?: () => void
  layers: Layer[]
  selection: WordSelection | null
  isLayersOn: boolean
}) {
  const [extensions] = useState(() => createSimpleEditorExtensions())

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

  useLayerDecorations(editor, layers, index, isLocked, isLayersOn)
  useSelectionDecoration(editor, selection, index)

  const handleFocus = useCallback(() => {
    onFocus(index)
  }, [index, onFocus])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !editor) return

      const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })
      if (!pos) {
        onNonWordClick?.()
        return
      }

      const result = getWordBoundaries(editor.state.doc, pos.pos)
      if (!result) {
        onNonWordClick?.()
        return
      }

      onWordClick?.(index, result.from, result.to, result.text)
    },
    [isLocked, onWordClick, onNonWordClick, editor, index]
  )

  return (
    <div className="simple-editor-wrapper" onFocusCapture={handleFocus} onClick={handleClick}>
      <EditorContent
        editor={editor}
        role="presentation"
        className="simple-editor-content"
      />
    </div>
  )
}
