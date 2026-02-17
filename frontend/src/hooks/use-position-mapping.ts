import { useEffect, useRef } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer } from "@/types/editor"

interface UsePositionMappingOptions {
  editor: Editor | null
  editorIndex: number
  layers: Layer[]
  setLayers?: React.Dispatch<React.SetStateAction<Layer[]>>
}

/**
 * Maps stored annotation/arrow/underline positions through ProseMirror
 * transaction mappings when editor content changes, keeping them in sync.
 */
export function usePositionMapping({
  editor,
  editorIndex,
  layers,
  setLayers,
}: UsePositionMappingOptions) {
  const layersRef = useRef(layers)
  layersRef.current = layers

  useEffect(() => {
    if (!editor || !setLayers) return

    const handleTransaction = ({ transaction }: { transaction: any }) => {
      if (!transaction.docChanged) return

      const { mapping } = transaction

      setLayers((prev) =>
        prev.map((layer) => {
          let changed = false

          const highlights = layer.highlights.map((h) => {
            if (h.editorIndex !== editorIndex) return h
            const newFrom = mapping.map(h.from, 1)
            const newTo = mapping.map(h.to, -1)
            if (newFrom === h.from && newTo === h.to) return h
            changed = true
            return { ...h, from: newFrom, to: newTo }
          })

          const arrows = layer.arrows.map((a) => {
            let arrowChanged = false
            let newFrom = a.from
            let newTo = a.to

            if (a.from.editorIndex === editorIndex) {
              const mappedFrom = mapping.map(a.from.from, 1)
              const mappedTo = mapping.map(a.from.to, -1)
              if (mappedFrom !== a.from.from || mappedTo !== a.from.to) {
                newFrom = { ...a.from, from: mappedFrom, to: mappedTo }
                arrowChanged = true
              }
            }

            if (a.to.editorIndex === editorIndex) {
              const mappedFrom = mapping.map(a.to.from, 1)
              const mappedTo = mapping.map(a.to.to, -1)
              if (mappedFrom !== a.to.from || mappedTo !== a.to.to) {
                newTo = { ...a.to, from: mappedFrom, to: mappedTo }
                arrowChanged = true
              }
            }

            if (!arrowChanged) return a
            changed = true
            return { ...a, from: newFrom, to: newTo }
          })

          const underlines = layer.underlines.map((u) => {
            if (u.editorIndex !== editorIndex) return u
            const newFrom = mapping.map(u.from, 1)
            const newTo = mapping.map(u.to, -1)
            if (newFrom === u.from && newTo === u.to) return u
            changed = true
            return { ...u, from: newFrom, to: newTo }
          })

          if (!changed) return layer
          return { ...layer, highlights, arrows, underlines }
        })
      )
    }

    editor.on("transaction", handleTransaction)
    return () => {
      editor.off("transaction", handleTransaction)
    }
  }, [editor, editorIndex, setLayers])
}
