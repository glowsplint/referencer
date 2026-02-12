import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer, DrawingState, ActiveTool } from "@/types/editor"
import { getWordCenter, getWordRect } from "@/lib/tiptap/nearest-word"
import { blendWithBackground } from "@/lib/color"

const ARROW_OPACITY = 0.6

interface ArrowOverlayProps {
  layers: Layer[]
  drawingState: DrawingState | null
  drawingColor: string | null
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRef: React.RefObject<HTMLDivElement | null>
  removeArrow: (layerId: string, arrowId: string) => void
  activeTool: ActiveTool
  sectionVisibility: boolean[]
  isDarkMode: boolean
  isLocked: boolean
}

interface WordRect {
  x: number
  y: number
  width: number
  height: number
}

interface ArrowPosition {
  layerId: string
  arrowId: string
  color: string
  x1: number
  y1: number
  x2: number
  y2: number
  fromRect: WordRect | null
  toRect: WordRect | null
}

export function ArrowOverlay({
  layers,
  drawingState,
  drawingColor,
  editorsRef,
  containerRef,
  removeArrow,
  activeTool,
  sectionVisibility,
  isDarkMode,
  isLocked,
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

  // Recalculate on scroll (capture phase since scroll doesn't bubble)
  const rafId = useRef(0)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onScroll = () => {
      cancelAnimationFrame(rafId.current)
      rafId.current = requestAnimationFrame(recalc)
    }
    container.addEventListener("scroll", onScroll, true)
    return () => {
      container.removeEventListener("scroll", onScroll, true)
      cancelAnimationFrame(rafId.current)
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
            fromRect: isLocked ? getWordRect(arrow.from, editorsRef, containerRect) : null,
            toRect: isLocked ? getWordRect(arrow.to, editorsRef, containerRect) : null,
          })
        }
      }
    }

    return positions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, editorsRef, containerRect?.width, containerRect?.height, tick, sectionVisibility, isLocked])

  const previewPosition = useMemo(() => {
    if (!drawingState || !containerRect) return null
    if (sectionVisibility[drawingState.anchor.editorIndex] === false) return null
    if (sectionVisibility[drawingState.cursor.editorIndex] === false) return null
    const fromCenter = getWordCenter(drawingState.anchor, editorsRef, containerRect)
    const toCenter = getWordCenter(drawingState.cursor, editorsRef, containerRect)
    if (!fromCenter || !toCenter) return null
    const anchorRect = getWordRect(drawingState.anchor, editorsRef, containerRect)
    if (fromCenter.cx === toCenter.cx && fromCenter.cy === toCenter.cy) return { anchorRect }
    return {
      x1: fromCenter.cx,
      y1: fromCenter.cy,
      x2: toCenter.cx,
      y2: toCenter.cy,
      anchorRect,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingState, editorsRef, containerRect?.width, containerRect?.height, tick])

  const blendArrow = useCallback(
    (hex: string) => blendWithBackground(hex, ARROW_OPACITY, isDarkMode),
    [isDarkMode]
  )

  return (
    <>
      {/* Visual layer: blend mode applied here for highlighter effect */}
      <svg
        data-testid="arrow-overlay"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: "100%", height: "100%", mixBlendMode: isDarkMode ? "screen" : "multiply" }}
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
              <polygon points="0 0, 8 3, 0 6" fill={blendArrow(drawingColor)} />
            </marker>
          )}
        </defs>

        {arrowPositions.map((pos) => {
          const mx = (pos.x1 + pos.x2) / 2
          const my = (pos.y1 + pos.y2) / 2
          const arrowPath = `M ${pos.x1} ${pos.y1} L ${mx} ${my} L ${pos.x2} ${pos.y2}`
          return (
            <g key={pos.arrowId} opacity={ARROW_OPACITY}>
              {pos.fromRect && (
                <rect
                  data-testid="arrow-endpoint-rect"
                  x={pos.fromRect.x}
                  y={pos.fromRect.y}
                  width={pos.fromRect.width}
                  height={pos.fromRect.height}
                  fill={pos.color}
                />
              )}
              {pos.toRect && (
                <rect
                  data-testid="arrow-endpoint-rect"
                  x={pos.toRect.x}
                  y={pos.toRect.y}
                  width={pos.toRect.width}
                  height={pos.toRect.height}
                  fill={pos.color}
                />
              )}
              <path
                data-testid="arrow-line"
                d={arrowPath}
                stroke={pos.color}
                strokeWidth={2}
                fill="none"
                markerMid={`url(#arrowhead-${pos.arrowId})`}
              />
            </g>
          )
        })}

        {previewPosition && drawingColor && (() => {
          const hasLine = "x1" in previewPosition
          return (
            <g opacity={ARROW_OPACITY}>
              {previewPosition.anchorRect && (
                <rect
                  data-testid="preview-anchor-rect"
                  x={previewPosition.anchorRect.x}
                  y={previewPosition.anchorRect.y}
                  width={previewPosition.anchorRect.width}
                  height={previewPosition.anchorRect.height}
                  fill={drawingColor}
                />
              )}
              {hasLine && (
                <path
                  data-testid="preview-arrow"
                  d={`M ${previewPosition.x1} ${previewPosition.y1} L ${(previewPosition.x1! + previewPosition.x2!) / 2} ${(previewPosition.y1! + previewPosition.y2!) / 2} L ${previewPosition.x2} ${previewPosition.y2}`}
                  stroke={blendArrow(drawingColor)}
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  fill="none"
                  markerMid="url(#arrowhead-preview)"
                />
              )}
            </g>
          )
        })()}
      </svg>

      {/* Interaction layer: separate SVG without blend mode so pointer events work */}
      <svg
        data-testid="arrow-interaction-layer"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: "100%", height: "100%" }}
      >
        {arrowPositions.map((pos) => {
          const mx = (pos.x1 + pos.x2) / 2
          const my = (pos.y1 + pos.y2) / 2
          const arrowPath = `M ${pos.x1} ${pos.y1} L ${mx} ${my} L ${pos.x2} ${pos.y2}`
          const isHovered = hoveredArrowId === pos.arrowId
          const strokeColor = blendArrow(pos.color)
          return (
            <g key={pos.arrowId}>
              <path
                data-testid="arrow-hit-area"
                d={arrowPath}
                stroke="transparent"
                strokeWidth={12}
                fill="none"
                style={{
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredArrowId(pos.arrowId)}
                onMouseLeave={() => setHoveredArrowId(null)}
                onClick={() => removeArrow(pos.layerId, pos.arrowId)}
              />
              {isHovered && (
                <g
                  transform={`translate(${mx}, ${my})`}
                  style={{ pointerEvents: "none" }}
                >
                  <circle r="8" fill="white" stroke={strokeColor} strokeWidth={1.5} />
                  <path
                    d="M -3 -3 L 3 3 M 3 -3 L -3 3"
                    stroke={strokeColor}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </>
  )
}
