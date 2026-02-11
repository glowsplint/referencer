import { useState, useEffect, useCallback, useMemo } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer, DrawingState } from "@/types/editor"
import { getWordCenter } from "@/lib/tiptap/nearest-word"

interface ArrowOverlayProps {
  layers: Layer[]
  drawingState: DrawingState | null
  drawingColor: string | null
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRef: React.RefObject<HTMLDivElement | null>
  removeArrow: (layerId: string, arrowId: string) => void
  sectionVisibility: boolean[]
}

interface ArrowPosition {
  layerId: string
  arrowId: string
  color: string
  x1: number
  y1: number
  x2: number
  y2: number
}

export function ArrowOverlay({
  layers,
  drawingState,
  drawingColor,
  editorsRef,
  containerRef,
  removeArrow,
  sectionVisibility,
}: ArrowOverlayProps) {
  const [tick, setTick] = useState(0)
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null)

  const recalc = useCallback(() => setTick((t) => t + 1), [])

  // Recalculate on resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(recalc)
    ro.observe(container)
    window.addEventListener("resize", recalc)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", recalc)
    }
  }, [containerRef, recalc])

  // Recalculate when layers, drawingState, or sectionVisibility change
  useEffect(() => {
    recalc()
  }, [layers, drawingState, sectionVisibility, recalc])

  const containerRect = containerRef.current?.getBoundingClientRect()

  const arrowPositions = useMemo(() => {
    if (!containerRect) return []
    const positions: ArrowPosition[] = []

    for (const layer of layers) {
      if (!layer.visible) continue
      for (const arrow of layer.arrows) {
        if (sectionVisibility[arrow.from.editorIndex] === false) continue
        if (sectionVisibility[arrow.to.editorIndex] === false) continue
        const fromCenter = getWordCenter(arrow.from, editorsRef, containerRect)
        const toCenter = getWordCenter(arrow.to, editorsRef, containerRect)
        if (fromCenter && toCenter) {
          positions.push({
            layerId: layer.id,
            arrowId: arrow.id,
            color: layer.color,
            x1: fromCenter.cx,
            y1: fromCenter.cy,
            x2: toCenter.cx,
            y2: toCenter.cy,
          })
        }
      }
    }

    return positions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, editorsRef, containerRect?.width, containerRect?.height, tick, sectionVisibility])

  const previewPosition = useMemo(() => {
    if (!drawingState || !containerRect) return null
    if (sectionVisibility[drawingState.anchor.editorIndex] === false) return null
    if (sectionVisibility[drawingState.cursor.editorIndex] === false) return null
    const fromCenter = getWordCenter(drawingState.anchor, editorsRef, containerRect)
    const toCenter = getWordCenter(drawingState.cursor, editorsRef, containerRect)
    if (!fromCenter || !toCenter) return null
    if (fromCenter.cx === toCenter.cx && fromCenter.cy === toCenter.cy) return null
    return {
      x1: fromCenter.cx,
      y1: fromCenter.cy,
      x2: toCenter.cx,
      y2: toCenter.cy,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingState, editorsRef, containerRect?.width, containerRect?.height, tick])

  return (
    <svg
      data-testid="arrow-overlay"
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: "100%", height: "100%" }}
    >
      <defs>
        {arrowPositions.map((pos) => (
          <marker
            key={`marker-${pos.arrowId}`}
            id={`arrowhead-${pos.arrowId}`}
            markerWidth="8"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={pos.color} />
          </marker>
        ))}
        {previewPosition && drawingColor && (
          <marker
            id="arrowhead-preview"
            markerWidth="8"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={drawingColor} />
          </marker>
        )}
      </defs>

      {arrowPositions.map((pos) => {
        const mx = (pos.x1 + pos.x2) / 2
        const my = (pos.y1 + pos.y2) / 2
        const isHovered = hoveredArrowId === pos.arrowId
        return (
          <g key={pos.arrowId}>
            <path
              data-testid="arrow-line"
              d={`M ${pos.x1} ${pos.y1} L ${mx} ${my} L ${pos.x2} ${pos.y2}`}
              stroke={pos.color}
              strokeWidth={2}
              fill="none"
              opacity={0.6}
              markerMid={`url(#arrowhead-${pos.arrowId})`}
            />
            {/* Wider invisible hit area for easier hovering/clicking */}
            <path
              data-testid="arrow-hit-area"
              d={`M ${pos.x1} ${pos.y1} L ${mx} ${my} L ${pos.x2} ${pos.y2}`}
              stroke="transparent"
              strokeWidth={12}
              fill="none"
              style={{ pointerEvents: "auto", cursor: "pointer" }}
              onMouseEnter={() => setHoveredArrowId(pos.arrowId)}
              onMouseLeave={() => setHoveredArrowId(null)}
              onClick={() => removeArrow(pos.layerId, pos.arrowId)}
            />
            {isHovered && (
              <g
                transform={`translate(${mx}, ${my})`}
                style={{ pointerEvents: "none" }}
              >
                <circle r="8" fill="white" stroke={pos.color} strokeWidth={1.5} />
                <path
                  d="M -3 -3 L 3 3 M 3 -3 L -3 3"
                  stroke={pos.color}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        )
      })}

      {previewPosition && drawingColor && (() => {
        const mx = (previewPosition.x1 + previewPosition.x2) / 2
        const my = (previewPosition.y1 + previewPosition.y2) / 2
        return (
          <path
            data-testid="preview-arrow"
            d={`M ${previewPosition.x1} ${previewPosition.y1} L ${mx} ${my} L ${previewPosition.x2} ${previewPosition.y2}`}
            stroke={drawingColor}
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="none"
            opacity={0.6}
            markerMid="url(#arrowhead-preview)"
          />
        )
      })()}
    </svg>
  )
}
