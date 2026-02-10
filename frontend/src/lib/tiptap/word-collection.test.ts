import { describe, it, expect } from "vitest"
import { collectAllWords } from "./word-collection"

function mockEditor(blocks: string[]) {
  const children: { isTextblock: boolean; textContent: string }[] = blocks.map(
    (text) => ({ isTextblock: true, textContent: text })
  )

  // Simulate ProseMirror positions: each block has opening token (1 char)
  // and content length, plus closing token
  const doc = {
    descendants(callback: (node: any, pos: number) => boolean | void) {
      let pos = 0
      for (const child of children) {
        callback(child, pos)
        // pos + 1 (opening) + textContent.length + 1 (closing)
        pos += 1 + child.textContent.length + 1
      }
    },
  }

  return { state: { doc } } as any
}

describe("collectAllWords", () => {
  it("extracts words from a single paragraph", () => {
    const editor = mockEditor(["hello world"])
    const words = collectAllWords(editor, 0)

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "hello" },
      { editorIndex: 0, from: 7, to: 12, text: "world" },
    ])
  })

  it("extracts words from multiple paragraphs", () => {
    const editor = mockEditor(["foo", "bar baz"])
    const words = collectAllWords(editor, 0)

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 4, text: "foo" },
      { editorIndex: 0, from: 6, to: 9, text: "bar" },
      { editorIndex: 0, from: 10, to: 13, text: "baz" },
    ])
  })

  it("returns empty array for empty doc", () => {
    const editor = mockEditor([])
    expect(collectAllWords(editor, 0)).toEqual([])
  })

  it("skips non-word punctuation characters", () => {
    const editor = mockEditor(["hello, world!"])
    const words = collectAllWords(editor, 0)

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "hello" },
      { editorIndex: 0, from: 8, to: 13, text: "world" },
    ])
  })

  it("includes apostrophes as part of words", () => {
    const editor = mockEditor(["don't stop"])
    const words = collectAllWords(editor, 0)

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "don't" },
      { editorIndex: 0, from: 7, to: 11, text: "stop" },
    ])
  })

  it("includes hyphens as part of words", () => {
    const editor = mockEditor(["well-known fact"])
    const words = collectAllWords(editor, 0)

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 11, text: "well-known" },
      { editorIndex: 0, from: 12, to: 16, text: "fact" },
    ])
  })

  it("includes numbers as words", () => {
    const editor = mockEditor(["test123 456"])
    const words = collectAllWords(editor, 0)

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 8, text: "test123" },
      { editorIndex: 0, from: 9, to: 12, text: "456" },
    ])
  })

  it("uses the provided editorIndex", () => {
    const editor = mockEditor(["hi"])
    const words = collectAllWords(editor, 2)

    expect(words).toEqual([
      { editorIndex: 2, from: 1, to: 3, text: "hi" },
    ])
  })
})
