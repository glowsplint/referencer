import { useMemo } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer, EditingAnnotation } from "@/types/editor"
import { useAllHighlightPositions } from "@/hooks/use-all-highlight-positions"
import { resolveAnnotationOverlaps } from "@/lib/resolve-annotation-overlaps"
import { parseHexToRgba } from "@/lib/color"
import { AnnotationCard } from "./AnnotationCard"

interface AnnotationPanelProps {
  layers: Layer[]
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRef: React.RefObject<HTMLDivElement | null>
  editingAnnotation: EditingAnnotation | null
  onAnnotationChange: (layerId: string, highlightId: string, annotation: string) => void
  onAnnotationBlur: (layerId: string, highlightId: string, annotation: string) => void
  onAnnotationClick: (layerId: string, highlightId: string) => void
}

const PANEL_WIDTH = 224 // w-56
const CONNECTOR_GAP = 8

export function AnnotationPanel({
  layers,
  editorsRef,
  containerRef,
  editingAnnotation,
  onAnnotationChange,
  onAnnotationBlur,
  onAnnotationClick,
}: AnnotationPanelProps) {
  const positions = useAllHighlightPositions(editorsRef, layers, containerRef)

  const resolvedPositions = useMemo(() => {
    return resolveAnnotationOverlaps(
      positions.map((p) => ({ id: p.highlightId, desiredTop: p.top }))
    )
  }, [positions])

  // Build lookup maps
  const colorByHighlightId = useMemo(() => {
    const map = new Map<string, string>()
    for (const layer of layers) {
      for (const h of layer.highlights) {
        map.set(h.id, layer.color)
      }
    }
    return map
  }, [layers])

  const layerIdByHighlightId = useMemo(() => {
    const map = new Map<string, string>()
    for (const layer of layers) {
      for (const h of layer.highlights) {
        map.set(h.id, layer.id)
      }
    }
    return map
  }, [layers])

  const annotationByHighlightId = useMemo(() => {
    const map = new Map<string, string>()
    for (const layer of layers) {
      if (!layer.visible) continue
      for (const h of layer.highlights) {
        map.set(h.id, h.annotation)
      }
    }
    return map
  }, [layers])

  const positionByHighlightId = useMemo(() => {
    const map = new Map<string, { top: number; rightEdge: number }>()
    for (const p of positions) {
      map.set(p.highlightId, { top: p.top, rightEdge: p.rightEdge })
    }
    return map
  }, [positions])

  if (positions.length === 0) return null

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: PANEL_WIDTH }}
      data-testid="annotation-panel"
    >
      {/* SVG connector lines - overflow visible to extend into editor area */}
      <svg
        className="pointer-events-none absolute inset-0"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {resolvedPositions.map((resolved) => {
          const original = positionByHighlightId.get(resolved.id)
          if (!original) return null
          const color = colorByHighlightId.get(resolved.id)
          if (!color) return null

          // x1 is relative to the panel - the rightEdge is relative to the container,
          // so we need to negate it from the panel's perspective (panel is to the right of container)
          const containerEl = containerRef.current
          const containerWidth = containerEl ? containerEl.offsetWidth : 0
          const x1 = original.rightEdge - containerWidth - CONNECTOR_GAP
          const y1 = original.top + 10
          const x2 = 16 // left padding inside panel
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
      <div className="absolute top-0 left-4 right-0 z-10 pointer-events-auto">
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
              onChange={onAnnotationChange}
              onBlur={onAnnotationBlur}
              onClick={onAnnotationClick}
            />
          )
        })}
      </div>
    </div>
  )
}
