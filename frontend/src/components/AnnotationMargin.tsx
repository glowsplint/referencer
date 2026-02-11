import { useLayoutEffect, useMemo, useState } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer, EditingAnnotation } from "@/types/editor"
import { useHighlightPositions } from "@/hooks/use-highlight-positions"
import { resolveAnnotationOverlaps } from "@/lib/resolve-annotation-overlaps"
import { parseHexToRgba } from "@/lib/color"
import { AnnotationCard } from "./AnnotationCard"

interface AnnotationMarginProps {
  editor: Editor | null
  editorIndex: number
  layers: Layer[]
  wrapperRef: React.RefObject<HTMLDivElement | null>
  editingAnnotation: EditingAnnotation | null
  onAnnotationChange?: (layerId: string, highlightId: string, annotation: string) => void
  onAnnotationBlur?: (layerId: string, highlightId: string, annotation: string) => void
  onAnnotationClick?: (layerId: string, highlightId: string) => void
}

const CARD_WIDTH = 192 // w-48
const RIGHT_PAD = 16

export function AnnotationMargin({
  editor,
  editorIndex,
  layers,
  wrapperRef,
  editingAnnotation,
  onAnnotationChange,
  onAnnotationBlur,
  onAnnotationClick,
}: AnnotationMarginProps) {
  const [wrapperWidth, setWrapperWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWrapperWidth(entry.contentRect.width)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [wrapperRef])

  const annotationLeft =
    wrapperWidth !== null
      ? wrapperWidth - CARD_WIDTH - RIGHT_PAD
      : 0

  // Collect highlights for this editor across all visible layers
  const highlightsWithLayer = useMemo(() => {
    const result: { highlight: Layer["highlights"][0]; layerId: string }[] = []
    for (const layer of layers) {
      if (!layer.visible) continue
      for (const highlight of layer.highlights) {
        if (highlight.editorIndex === editorIndex) {
          result.push({ highlight, layerId: layer.id })
        }
      }
    }
    return result
  }, [layers, editorIndex])

  const positions = useHighlightPositions(editor, highlightsWithLayer, wrapperRef)

  // Resolve overlaps
  const resolvedPositions = useMemo(() => {
    return resolveAnnotationOverlaps(
      positions.map((p) => ({ id: p.highlightId, desiredTop: p.top }))
    )
  }, [positions])

  if (highlightsWithLayer.length === 0) return null

  // Build lookup maps
  const colorByHighlightId = new Map<string, string>()
  const layerIdByHighlightId = new Map<string, string>()
  for (const layer of layers) {
    for (const h of layer.highlights) {
      colorByHighlightId.set(h.id, layer.color)
      layerIdByHighlightId.set(h.id, layer.id)
    }
  }

  const annotationByHighlightId = new Map<string, string>()
  for (const { highlight } of highlightsWithLayer) {
    annotationByHighlightId.set(highlight.id, highlight.annotation)
  }

  const positionByHighlightId = new Map<string, { top: number; rightEdge: number }>()
  for (const p of positions) {
    positionByHighlightId.set(p.highlightId, { top: p.top, rightEdge: p.rightEdge })
  }

  return (
    <>
      {/* SVG connector lines */}
      <svg
        className="pointer-events-none absolute inset-0"
        style={{ width: annotationLeft + CARD_WIDTH + 16, height: "100%", overflow: "visible" }}
      >
        {resolvedPositions.map((resolved) => {
          const original = positionByHighlightId.get(resolved.id)
          if (!original) return null
          const color = colorByHighlightId.get(resolved.id)
          if (!color) return null

          const x1 = original.rightEdge + 4
          const y1 = original.top + 10
          const x2 = annotationLeft
          const y2 = resolved.top + 10

          return (
            <line
              key={`line-${resolved.id}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={parseHexToRgba(color, 0.4)}
              strokeWidth={1}
            />
          )
        })}
      </svg>

      {/* Annotation cards */}
      <div
        className="absolute top-0 z-10 pointer-events-auto"
        style={{ left: annotationLeft }}
      >
        {resolvedPositions.map((resolved) => {
          const color = colorByHighlightId.get(resolved.id) ?? "#888"
          const layerId = layerIdByHighlightId.get(resolved.id) ?? ""
          const annotation = annotationByHighlightId.get(resolved.id) ?? ""
          const isEditing =
            editingAnnotation?.highlightId === resolved.id &&
            editingAnnotation?.layerId === layerId

          return (
            <AnnotationCard
              key={resolved.id}
              layerId={layerId}
              highlightId={resolved.id}
              color={color}
              annotation={annotation}
              isEditing={isEditing}
              top={resolved.top}
              onChange={onAnnotationChange ?? (() => {})}
              onBlur={onAnnotationBlur ?? (() => {})}
              onClick={onAnnotationClick ?? (() => {})}
            />
          )
        })}
      </div>
    </>
  )
}
