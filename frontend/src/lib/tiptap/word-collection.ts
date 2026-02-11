import type { Editor } from "@tiptap/react"

export interface CollectedWord {
  editorIndex: number
  from: number
  to: number
  text: string
  isImage?: boolean
}

const HAS_ALPHANUMERIC = /[a-zA-Z0-9]/

/** Matches words containing at least one alphanumeric, optionally surrounded by apostrophes/hyphens */
const WORD_PATTERN = /[a-zA-Z0-9'-]*[a-zA-Z0-9][a-zA-Z0-9'-]*/g

export function collectAllWords(editor: Editor, editorIndex: number): CollectedWord[] {
  const words: CollectedWord[] = []
  const doc = editor.state.doc

  doc.descendants((node, pos) => {
    if (node.type?.name === "image" && node.attrs?.alt) {
      const altText = node.attrs.alt
      if (HAS_ALPHANUMERIC.test(altText)) {
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
    const regex = new RegExp(WORD_PATTERN.source, WORD_PATTERN.flags)
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      // pos + 1 skips the textblock node's opening token in ProseMirror offsets
      const wordStart = pos + 1 + match.index
      words.push({
        editorIndex,
        from: wordStart,
        to: wordStart + match[0].length,
        text: match[0],
      })
    }
    return false
  })

  return words
}
