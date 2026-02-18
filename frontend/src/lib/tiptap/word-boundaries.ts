// Resolves the word boundaries (from/to) at a given ProseMirror document position.
// Walks backward and forward through the textblock content using a word-character
// regex to find the start and end of the word under the cursor.
import type { Node as PMNode } from "@tiptap/pm/model"

export function getWordBoundaries(doc: PMNode, pos: number): { from: number; to: number; text: string } | null {
  const resolved = doc.resolve(pos)
  const parent = resolved.parent
  if (!parent.isTextblock) return null

  const parentOffset = resolved.parentOffset
  const textContent = parent.textContent
  if (!textContent) return null

  // Walk backward to find word start
  let start = parentOffset
  while (start > 0 && /[\w'-]/.test(textContent[start - 1])) start--

  // Walk forward to find word end
  let end = parentOffset
  while (end < textContent.length && /[\w'-]/.test(textContent[end])) end++

  if (start === end) return null

  const word = textContent.slice(start, end)

  // Convert parent-relative offsets to absolute doc positions
  const blockStart = resolved.start()
  return { from: blockStart + start, to: blockStart + end, text: word }
}
