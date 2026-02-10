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
}: ArrowOverlayProps) {
  const [tick, setTick] = useState(0)

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

  // Recalculate when layers or drawingState change
  useEffect(() => {
    recalc()
  }, [layers, drawingState, recalc])

  const containerRect = containerRef.current?.getBoundingClientRect()

  const arrowPositions = useMemo(() => {
    if (!containerRect) return []
    const positions: ArrowPosition[] = []

    for (const layer of layers) {
      if (!layer.visible) continue
      for (const arrow of layer.arrows) {
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
  }, [layers, editorsRef, containerRect?.width, containerRect?.height, tick])

  const previewPosition = useMemo(() => {
    if (!drawingState || !containerRect) return null
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
            refX="8"
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
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={drawingColor} />
          </marker>
        )}
      </defs>

      {arrowPositions.map((pos) => (
        <line
          key={pos.arrowId}
          data-testid="arrow-line"
          className="arrow-line"
          x1={pos.x1}
          y1={pos.y1}
          x2={pos.x2}
          y2={pos.y2}
          stroke={pos.color}
          strokeWidth={2}
          markerEnd={`url(#arrowhead-${pos.arrowId})`}
          style={{ pointerEvents: "auto", cursor: "pointer" }}
          onClick={() => removeArrow(pos.layerId, pos.arrowId)}
        />
      ))}

      {previewPosition && drawingColor && (
        <line
          data-testid="preview-arrow"
          x1={previewPosition.x1}
          y1={previewPosition.y1}
          x2={previewPosition.x2}
          y2={previewPosition.y2}
          stroke={drawingColor}
          strokeWidth={2}
          strokeDasharray="6 4"
          markerEnd="url(#arrowhead-preview)"
        />
      )}
    </svg>
  )
}
