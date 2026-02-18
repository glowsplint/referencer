// Side panel that renders annotation cards alongside the editor, connected by
// SVG lines to their corresponding highlights. Resolves vertical overlaps so
// cards don't stack on top of each other, and draws connector lines from each
// highlight's right edge to its card using blended colors.
import { useMemo } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer, EditingAnnotation } from "@/types/editor"
import { useAllHighlightPositions } from "@/hooks/use-all-highlight-positions"
import { resolveAnnotationOverlaps } from "@/lib/resolve-annotation-overlaps"
import { blendWithBackground } from "@/lib/color"
import { AnnotationCard } from "./AnnotationCard"

interface AnnotationPanelProps {
  layers: Layer[]
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRef: React.RefObject<HTMLDivElement | null>
  editingAnnotation: EditingAnnotation | null
  onAnnotationChange: (layerId: string, highlightId: string, annotation: string) => void
  onAnnotationBlur: (layerId: string, highlightId: string, annotation: string) => void
  onAnnotationClick: (layerId: string, highlightId: string) => void
  isDarkMode: boolean
  sectionVisibility: boolean[]
}

const PANEL_WIDTH = 224 // w-56
const CONNECTOR_GAP = 8      // px between highlight right edge and connector line start
const CONNECTOR_Y_OFFSET = 10 // vertically center connector on text line (~half line height)
const PANEL_LEFT_PAD = 16     // left-4 (Tailwind) — connector endpoint inside panel
const CONNECTOR_OPACITY = 0.4

export function AnnotationPanel({
  layers,
  editorsRef,
  containerRef,
  editingAnnotation,
  onAnnotationChange,
  onAnnotationBlur,
  onAnnotationClick,
  isDarkMode,
  sectionVisibility,
}: AnnotationPanelProps) {
  const positions = useAllHighlightPositions(editorsRef, layers, containerRef, sectionVisibility)

  const resolvedPositions = useMemo(() => {
    return resolveAnnotationOverlaps(
      positions.map((p) => ({ id: p.highlightId, desiredTop: p.top }))
    )
  }, [positions])

  // Precompute fast lookups from highlight ID -> color, layerId, annotation text.
  // Only includes annotations from visible layers so hidden layers don't render.
  const highlightLookup = useMemo(() => {
    const color = new Map<string, string>()
    const layerId = new Map<string, string>()
    const annotation = new Map<string, string>()
    for (const layer of layers) {
      for (const h of layer.highlights) {
        color.set(h.id, layer.color)
        layerId.set(h.id, layer.id)
        if (layer.visible) annotation.set(h.id, h.annotation)
      }
    }
    return { color, layerId, annotation }
  }, [layers])

  const positionByHighlightId = useMemo(() => {
    const map = new Map<string, { top: number; rightEdge: number }>()
    for (const p of positions) {
      map.set(p.highlightId, { top: p.top, rightEdge: p.rightEdge })
    }
    return map
  }, [positions])

  /* eslint-disable react-hooks/refs -- ref read for SVG line positioning */
  const containerWidth = containerRef.current?.offsetWidth ?? 0

  // Always render the wrapper div to reserve panel width in the flex layout.
  // This ensures useLayoutEffect computes highlight positions AFTER the editor
  // container has shrunk, preventing stale coordinates on the first annotation.
  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: PANEL_WIDTH, overflowY: "clip" }}
      data-testid="annotation-panel"
    >
      {positions.length > 0 && (
        <>
          {/* SVG connector lines - overflow visible to extend into editor area */}
          <svg
            className="pointer-events-none absolute inset-0"
            style={{ width: "100%", height: "100%", overflow: "visible", mixBlendMode: isDarkMode ? "screen" : "multiply" }}
          >
            {resolvedPositions.map((resolved) => {
              const original = positionByHighlightId.get(resolved.id)
              if (!original) return null
              const color = highlightLookup.color.get(resolved.id)
              if (!color) return null

              // x1 is relative to the panel - the rightEdge is relative to the container,
              // so we need to negate it from the panel's perspective (panel is to the right of container)
              const x1 = original.rightEdge - containerWidth - CONNECTOR_GAP
              const y1 = original.top + CONNECTOR_Y_OFFSET
              const x2 = PANEL_LEFT_PAD
              const y2 = resolved.top + CONNECTOR_Y_OFFSET

              return (
                <line
                  key={`line-${resolved.id}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={blendWithBackground(color, CONNECTOR_OPACITY, isDarkMode)}
                  strokeWidth={2}
                />
              )
            })}
          </svg>

          {/* Annotation cards */}
          <div className="absolute top-0 left-4 right-0 z-10 pointer-events-auto">
            {resolvedPositions.map((resolved) => {
              const color = highlightLookup.color.get(resolved.id) ?? "#888"
              const layerId = highlightLookup.layerId.get(resolved.id) ?? ""
              const annotation = highlightLookup.annotation.get(resolved.id) ?? ""
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
        </>
      )}
    </div>
  )
}
