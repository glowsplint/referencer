"use client"

import { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import type { Editor } from "@tiptap/react"

import { createSimpleEditorExtensions } from "./extensions"

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

function getWordBoundaries(doc: any, pos: number): { from: number; to: number; text: string } | null {
  const resolved = doc.resolve(pos)
  const parent = resolved.parent
  if (!parent.isTextblock) return null

  const parentOffset = resolved.parentOffset
  const textContent = parent.textContent
  if (!textContent) return null

  // Walk backward to find word start
  let start = parentOffset
  while (start > 0 && /\w/.test(textContent[start - 1])) start--

  // Walk forward to find word end
  let end = parentOffset
  while (end < textContent.length && /\w/.test(textContent[end])) end++

  if (start === end) return null

  const word = textContent.slice(start, end)

  // Convert parent-relative offsets to absolute doc positions
  const blockStart = resolved.start()
  return { from: blockStart + start, to: blockStart + end, text: word }
}

export function EditorPane({
  isLocked,
  content,
  index,
  onEditorMount,
  onFocus,
  onWordClick,
}: {
  isLocked: boolean
  content?: Record<string, unknown>
  index: number
  onEditorMount: (index: number, editor: Editor) => void
  onFocus: (index: number) => void
  onWordClick?: (editorIndex: number, from: number, to: number, text: string) => void
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

  const handleFocus = useCallback(() => {
    onFocus(index)
  }, [index, onFocus])

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isLocked || !onWordClick || !editor) return

      const pos = editor.view.posAtCoords({ left: e.clientX, top: e.clientY })
      if (!pos) return

      const result = getWordBoundaries(editor.state.doc, pos.pos)
      if (!result) return

      onWordClick(index, result.from, result.to, result.text)
    },
    [isLocked, onWordClick, editor, index]
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
