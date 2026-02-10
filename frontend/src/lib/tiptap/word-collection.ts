import type { Editor } from "@tiptap/react"

export interface CollectedWord {
  editorIndex: number
  from: number
  to: number
  text: string
  isImage?: boolean
}

export function collectAllWords(editor: Editor, editorIndex: number): CollectedWord[] {
  const words: CollectedWord[] = []
  const doc = editor.state.doc

  doc.descendants((node, pos) => {
    if (node.type.name === "image" && node.attrs?.alt) {
      const altText = node.attrs.alt
      if (/[a-zA-Z0-9]/.test(altText)) {
        words.push({
          editorIndex,
          from: pos,
          to: pos + node.nodeSize,
          text: altText,
          isImage: true,
        })
      }
      return false
    }

    if (!node.isTextblock) return true
    const text = node.textContent
    const regex = /[a-zA-Z0-9'-]*[a-zA-Z0-9][a-zA-Z0-9'-]*/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      words.push({
        editorIndex,
        from: pos + 1 + match.index,
        to: pos + 1 + match.index + match[0].length,
        text: match[0],
      })
    }
    return false
  })

  return words
}
