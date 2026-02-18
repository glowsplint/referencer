// Yjs shared types for collaborative annotations.
// Layers, highlights, arrows, and underlines are stored as Y.Array<Y.Map>
// with RelativePosition anchors that survive concurrent text edits.
import * as Y from "yjs"
import type { Layer, Highlight, Arrow, LayerUnderline, ArrowStyle } from "@/types/editor"

// ---------------------------------------------------------------------------
// Y.Doc structure for annotations
// ---------------------------------------------------------------------------
// doc.getArray("layers")  →  Y.Array<Y.Map>
//   each Y.Map has:
//     id: string, name: string, color: string, visible: boolean
//     highlights: Y.Array<Y.Map>
//     arrows: Y.Array<Y.Map>
//     underlines: Y.Array<Y.Map>
//
// Highlights/underlines Y.Map:
//   id, editorIndex, fromRel (Uint8Array), toRel (Uint8Array), text, annotation?, type?
//
// Arrows Y.Map:
//   id, fromEditorIndex, fromRel, fromToRel, fromText,
//       toEditorIndex, toRel, toToRel, toText, arrowStyle

// ---------------------------------------------------------------------------
// RelativePosition helpers
// ---------------------------------------------------------------------------

/** Encode a ProseMirror position as a RelativePosition relative to an XmlFragment */
export function encodeRelativePosition(
  doc: Y.Doc,
  editorIndex: number,
  pos: number
): Uint8Array {
  const fragment = doc.getXmlFragment(`editor-${editorIndex}`)
  const relPos = Y.createRelativePositionFromTypeIndex(fragment, pos)
  return Y.encodeRelativePosition(relPos)
}

/** Decode a RelativePosition back to an absolute ProseMirror position */
export function decodeRelativePosition(
  doc: Y.Doc,
  encoded: Uint8Array
): number | null {
  const relPos = Y.decodeRelativePosition(encoded)
  const absPos = Y.createAbsolutePositionFromRelativePosition(relPos, doc)
  return absPos?.index ?? null
}

// ---------------------------------------------------------------------------
// Initialize Y.Doc annotation structure
// ---------------------------------------------------------------------------

export function getLayersArray(doc: Y.Doc): Y.Array<Y.Map<unknown>> {
  return doc.getArray("layers")
}

/** Seed default layers into the Y.Doc if the layers array is empty */
export function seedDefaultLayers(doc: Y.Doc, defaultLayers: Layer[]): void {
  const yLayers = getLayersArray(doc)
  if (yLayers.length > 0) return // Already seeded

  doc.transact(() => {
    for (const layer of defaultLayers) {
      const yLayer = new Y.Map<unknown>()
      yLayer.set("id", layer.id)
      yLayer.set("name", layer.name)
      yLayer.set("color", layer.color)
      yLayer.set("visible", layer.visible)

      const yHighlights = new Y.Array<Y.Map<unknown>>()
      for (const h of layer.highlights) {
        const yH = new Y.Map<unknown>()
        yH.set("id", h.id)
        yH.set("editorIndex", h.editorIndex)
        yH.set("fromRel", encodeRelativePosition(doc, h.editorIndex, h.from))
        yH.set("toRel", encodeRelativePosition(doc, h.editorIndex, h.to))
        yH.set("text", h.text)
        yH.set("annotation", h.annotation)
        yH.set("type", h.type)
        yHighlights.push([yH])
      }
      yLayer.set("highlights", yHighlights)

      const yArrows = new Y.Array<Y.Map<unknown>>()
      for (const a of layer.arrows) {
        const yA = new Y.Map<unknown>()
        yA.set("id", a.id)
        yA.set("fromEditorIndex", a.from.editorIndex)
        yA.set("fromRel", encodeRelativePosition(doc, a.from.editorIndex, a.from.from))
        yA.set("fromToRel", encodeRelativePosition(doc, a.from.editorIndex, a.from.to))
        yA.set("fromText", a.from.text)
        yA.set("toEditorIndex", a.to.editorIndex)
        yA.set("toRel", encodeRelativePosition(doc, a.to.editorIndex, a.to.from))
        yA.set("toToRel", encodeRelativePosition(doc, a.to.editorIndex, a.to.to))
        yA.set("toText", a.to.text)
        yA.set("arrowStyle", a.arrowStyle ?? "solid")
        yArrows.push([yA])
      }
      yLayer.set("arrows", yArrows)

      const yUnderlines = new Y.Array<Y.Map<unknown>>()
      for (const u of layer.underlines) {
        const yU = new Y.Map<unknown>()
        yU.set("id", u.id)
        yU.set("editorIndex", u.editorIndex)
        yU.set("fromRel", encodeRelativePosition(doc, u.editorIndex, u.from))
        yU.set("toRel", encodeRelativePosition(doc, u.editorIndex, u.to))
        yU.set("text", u.text)
        yUnderlines.push([yU])
      }
      yLayer.set("underlines", yUnderlines)

      yLayers.push([yLayer])
    }
  })
}

// ---------------------------------------------------------------------------
// Read: Convert Yjs state → plain Layer[] for React rendering
// ---------------------------------------------------------------------------

export function readLayers(doc: Y.Doc): Layer[] {
  const yLayers = getLayersArray(doc)
  const layers: Layer[] = []

  for (let i = 0; i < yLayers.length; i++) {
    const yLayer = yLayers.get(i)
    const layer: Layer = {
      id: yLayer.get("id") as string,
      name: yLayer.get("name") as string,
      color: yLayer.get("color") as string,
      visible: yLayer.get("visible") as boolean,
      highlights: readHighlights(doc, yLayer),
      arrows: readArrows(doc, yLayer),
      underlines: readUnderlines(doc, yLayer),
    }
    layers.push(layer)
  }

  return layers
}

function readHighlights(doc: Y.Doc, yLayer: Y.Map<unknown>): Highlight[] {
  const yHighlights = yLayer.get("highlights") as Y.Array<Y.Map<unknown>> | undefined
  if (!yHighlights) return []

  const highlights: Highlight[] = []
  for (let i = 0; i < yHighlights.length; i++) {
    const yH = yHighlights.get(i)
    const id = yH.get("id") as string
    const editorIndex = yH.get("editorIndex") as number
    const fromRel = yH.get("fromRel")
    const toRel = yH.get("toRel")
    if (!(fromRel instanceof Uint8Array) || !(toRel instanceof Uint8Array)) {
      console.error("[yjs] highlight has invalid position data:", id)
      continue
    }
    const from = decodeRelativePosition(doc, fromRel)
    const to = decodeRelativePosition(doc, toRel)
    if (from === null || to === null) {
      console.warn("[yjs] highlight position lost:", id)
      continue
    }

    highlights.push({
      id,
      editorIndex,
      from,
      to,
      text: yH.get("text") as string,
      annotation: (yH.get("annotation") as string) ?? "",
      type: (yH.get("type") as "highlight" | "comment") ?? "highlight",
    })
  }

  return highlights
}

function readArrows(doc: Y.Doc, yLayer: Y.Map<unknown>): Arrow[] {
  const yArrows = yLayer.get("arrows") as Y.Array<Y.Map<unknown>> | undefined
  if (!yArrows) return []

  const arrows: Arrow[] = []
  for (let i = 0; i < yArrows.length; i++) {
    const yA = yArrows.get(i)
    const id = yA.get("id") as string
    const fromRel = yA.get("fromRel")
    const fromToRel = yA.get("fromToRel")
    const toRel = yA.get("toRel")
    const toToRel = yA.get("toToRel")
    if (
      !(fromRel instanceof Uint8Array) || !(fromToRel instanceof Uint8Array) ||
      !(toRel instanceof Uint8Array) || !(toToRel instanceof Uint8Array)
    ) {
      console.error("[yjs] arrow has invalid position data:", id)
      continue
    }
    const fromFrom = decodeRelativePosition(doc, fromRel)
    const fromTo = decodeRelativePosition(doc, fromToRel)
    const toFrom = decodeRelativePosition(doc, toRel)
    const toTo = decodeRelativePosition(doc, toToRel)
    if (fromFrom === null || fromTo === null || toFrom === null || toTo === null) {
      console.warn("[yjs] arrow position lost:", id)
      continue
    }

    arrows.push({
      id,
      from: {
        editorIndex: yA.get("fromEditorIndex") as number,
        from: fromFrom,
        to: fromTo,
        text: yA.get("fromText") as string,
      },
      to: {
        editorIndex: yA.get("toEditorIndex") as number,
        from: toFrom,
        to: toTo,
        text: yA.get("toText") as string,
      },
      arrowStyle: (yA.get("arrowStyle") as ArrowStyle) ?? "solid",
    })
  }

  return arrows
}

function readUnderlines(doc: Y.Doc, yLayer: Y.Map<unknown>): LayerUnderline[] {
  const yUnderlines = yLayer.get("underlines") as Y.Array<Y.Map<unknown>> | undefined
  if (!yUnderlines) return []

  const underlines: LayerUnderline[] = []
  for (let i = 0; i < yUnderlines.length; i++) {
    const yU = yUnderlines.get(i)
    const id = yU.get("id") as string
    const fromRel = yU.get("fromRel")
    const toRel = yU.get("toRel")
    if (!(fromRel instanceof Uint8Array) || !(toRel instanceof Uint8Array)) {
      console.error("[yjs] underline has invalid position data:", id)
      continue
    }
    const from = decodeRelativePosition(doc, fromRel)
    const to = decodeRelativePosition(doc, toRel)
    if (from === null || to === null) {
      console.warn("[yjs] underline position lost:", id)
      continue
    }

    underlines.push({
      id,
      editorIndex: yU.get("editorIndex") as number,
      from,
      to,
      text: yU.get("text") as string,
    })
  }

  return underlines
}

// ---------------------------------------------------------------------------
// Write: Mutation helpers for Yjs annotations
// ---------------------------------------------------------------------------

function findYLayer(doc: Y.Doc, layerId: string): { yLayer: Y.Map<unknown>; index: number } | null {
  const yLayers = getLayersArray(doc)
  for (let i = 0; i < yLayers.length; i++) {
    const yLayer = yLayers.get(i)
    if (yLayer.get("id") === layerId) return { yLayer, index: i }
  }
  return null
}

export function addLayerToDoc(
  doc: Y.Doc,
  opts: { id: string; name: string; color: string }
): void {
  const yLayers = getLayersArray(doc)
  const yLayer = new Y.Map<unknown>()
  yLayer.set("id", opts.id)
  yLayer.set("name", opts.name)
  yLayer.set("color", opts.color)
  yLayer.set("visible", true)
  yLayer.set("highlights", new Y.Array<Y.Map<unknown>>())
  yLayer.set("arrows", new Y.Array<Y.Map<unknown>>())
  yLayer.set("underlines", new Y.Array<Y.Map<unknown>>())
  yLayers.push([yLayer])
}

export function removeLayerFromDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  getLayersArray(doc).delete(result.index)
}

export function updateLayerNameInDoc(doc: Y.Doc, layerId: string, name: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  result.yLayer.set("name", name)
}

export function updateLayerColorInDoc(doc: Y.Doc, layerId: string, color: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  result.yLayer.set("color", color)
}

export function toggleLayerVisibilityInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  result.yLayer.set("visible", !(result.yLayer.get("visible") as boolean))
}

export function toggleAllLayerVisibilityInDoc(doc: Y.Doc): void {
  const yLayers = getLayersArray(doc)
  let anyVisible = false
  for (let i = 0; i < yLayers.length; i++) {
    if (yLayers.get(i).get("visible") as boolean) {
      anyVisible = true
      break
    }
  }
  doc.transact(() => {
    for (let i = 0; i < yLayers.length; i++) {
      yLayers.get(i).set("visible", !anyVisible)
    }
  })
}

export function addHighlightToDoc(
  doc: Y.Doc,
  layerId: string,
  highlight: Omit<Highlight, "id">,
  id: string
): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>
  const yH = new Y.Map<unknown>()
  yH.set("id", id)
  yH.set("editorIndex", highlight.editorIndex)
  yH.set("fromRel", encodeRelativePosition(doc, highlight.editorIndex, highlight.from))
  yH.set("toRel", encodeRelativePosition(doc, highlight.editorIndex, highlight.to))
  yH.set("text", highlight.text)
  yH.set("annotation", highlight.annotation)
  yH.set("type", highlight.type)
  yHighlights.push([yH])
}

export function removeHighlightFromDoc(doc: Y.Doc, layerId: string, highlightId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>
  for (let i = 0; i < yHighlights.length; i++) {
    if (yHighlights.get(i).get("id") === highlightId) {
      yHighlights.delete(i)
      return
    }
  }
}

export function updateHighlightAnnotationInDoc(
  doc: Y.Doc,
  layerId: string,
  highlightId: string,
  annotation: string
): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>
  for (let i = 0; i < yHighlights.length; i++) {
    const yH = yHighlights.get(i)
    if (yH.get("id") === highlightId) {
      yH.set("annotation", annotation)
      return
    }
  }
}

export function clearLayerHighlightsInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yHighlights = result.yLayer.get("highlights") as Y.Array<Y.Map<unknown>>
  if (yHighlights.length > 0) {
    yHighlights.delete(0, yHighlights.length)
  }
}

export function addArrowToDoc(
  doc: Y.Doc,
  layerId: string,
  arrow: Omit<Arrow, "id">,
  id: string
): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>
  const yA = new Y.Map<unknown>()
  yA.set("id", id)
  yA.set("fromEditorIndex", arrow.from.editorIndex)
  yA.set("fromRel", encodeRelativePosition(doc, arrow.from.editorIndex, arrow.from.from))
  yA.set("fromToRel", encodeRelativePosition(doc, arrow.from.editorIndex, arrow.from.to))
  yA.set("fromText", arrow.from.text)
  yA.set("toEditorIndex", arrow.to.editorIndex)
  yA.set("toRel", encodeRelativePosition(doc, arrow.to.editorIndex, arrow.to.from))
  yA.set("toToRel", encodeRelativePosition(doc, arrow.to.editorIndex, arrow.to.to))
  yA.set("toText", arrow.to.text)
  yA.set("arrowStyle", arrow.arrowStyle ?? "solid")
  yArrows.push([yA])
}

export function removeArrowFromDoc(doc: Y.Doc, layerId: string, arrowId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>
  for (let i = 0; i < yArrows.length; i++) {
    if (yArrows.get(i).get("id") === arrowId) {
      yArrows.delete(i)
      return
    }
  }
}

export function updateArrowStyleInDoc(
  doc: Y.Doc,
  layerId: string,
  arrowId: string,
  arrowStyle: ArrowStyle
): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>
  for (let i = 0; i < yArrows.length; i++) {
    const yA = yArrows.get(i)
    if (yA.get("id") === arrowId) {
      yA.set("arrowStyle", arrowStyle)
      return
    }
  }
}

export function clearLayerArrowsInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yArrows = result.yLayer.get("arrows") as Y.Array<Y.Map<unknown>>
  if (yArrows.length > 0) {
    yArrows.delete(0, yArrows.length)
  }
}

export function addUnderlineToDoc(
  doc: Y.Doc,
  layerId: string,
  underline: Omit<LayerUnderline, "id">,
  id: string
): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yUnderlines = result.yLayer.get("underlines") as Y.Array<Y.Map<unknown>>
  const yU = new Y.Map<unknown>()
  yU.set("id", id)
  yU.set("editorIndex", underline.editorIndex)
  yU.set("fromRel", encodeRelativePosition(doc, underline.editorIndex, underline.from))
  yU.set("toRel", encodeRelativePosition(doc, underline.editorIndex, underline.to))
  yU.set("text", underline.text)
  yUnderlines.push([yU])
}

export function removeUnderlineFromDoc(doc: Y.Doc, layerId: string, underlineId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yUnderlines = result.yLayer.get("underlines") as Y.Array<Y.Map<unknown>>
  for (let i = 0; i < yUnderlines.length; i++) {
    if (yUnderlines.get(i).get("id") === underlineId) {
      yUnderlines.delete(i)
      return
    }
  }
}

export function clearLayerUnderlinesInDoc(doc: Y.Doc, layerId: string): void {
  const result = findYLayer(doc, layerId)
  if (!result) return
  const yUnderlines = result.yLayer.get("underlines") as Y.Array<Y.Map<unknown>>
  if (yUnderlines.length > 0) {
    yUnderlines.delete(0, yUnderlines.length)
  }
}
