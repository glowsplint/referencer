import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer, DrawingState, ActiveTool, Arrow } from "@/types/editor"
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

interface CrossEditorArrow {
  layerId: string
  arrowId: string
  color: string
  arrow: Arrow
}

function computePath(
  arrow: Arrow,
  editorsRef: React.RefObject<Map<number, Editor>>,
  containerRect: DOMRect
): string | null {
  const fromCenter = getWordCenter(arrow.from, editorsRef, containerRect)
  const toCenter = getWordCenter(arrow.to, editorsRef, containerRect)
  if (!fromCenter || !toCenter) return null
  const mx = (fromCenter.cx + toCenter.cx) / 2
  const my = (fromCenter.cy + toCenter.cy) / 2
  return `M ${fromCenter.cx} ${fromCenter.cy} L ${mx} ${my} L ${toCenter.cx} ${toCenter.cy}`
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
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null)
  // Structural tick — only for structural changes (layers, visibility, preview), NOT scroll
  const [structuralTick, setStructuralTick] = useState(0)

  // Refs for imperative path updates on scroll
  const visualPathRefs = useRef<Map<string, SVGPathElement>>(new Map())
  const hitPathRefs = useRef<Map<string, SVGPathElement>>(new Map())
  const xIconRefs = useRef<Map<string, SVGGElement>>(new Map())

  // Cross-editor arrows only (for visual rendering — within-editor visuals are in the plugin)
  const crossEditorArrows = useMemo(() => {
    const result: CrossEditorArrow[] = []
    for (const layer of layers) {
      if (!layer.visible) continue
      for (const arrow of layer.arrows) {
        if (arrow.from.editorIndex === arrow.to.editorIndex) continue
        if (sectionVisibility[arrow.from.editorIndex] === false) continue
        if (sectionVisibility[arrow.to.editorIndex] === false) continue
        result.push({
          layerId: layer.id,
          arrowId: arrow.id,
          color: layer.color,
          arrow,
        })
      }
    }
    return result
  }, [layers, sectionVisibility])

  // All visible arrows (for interaction layer — handles hit areas for ALL arrows)
  const allVisibleArrows = useMemo(() => {
    const result: CrossEditorArrow[] = []
    for (const layer of layers) {
      if (!layer.visible) continue
      for (const arrow of layer.arrows) {
        if (sectionVisibility[arrow.from.editorIndex] === false) continue
        if (sectionVisibility[arrow.to.editorIndex] === false) continue
        result.push({
          layerId: layer.id,
          arrowId: arrow.id,
          color: layer.color,
          arrow,
        })
      }
    }
    return result
  }, [layers, sectionVisibility])

  // Imperatively update all path `d` attributes and X-icon positions
  const updatePositions = useCallback(() => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Update visual paths (cross-editor only)
    for (const data of crossEditorArrows) {
      const d = computePath(data.arrow, editorsRef, containerRect)
      if (!d) continue
      visualPathRefs.current.get(data.arrowId)?.setAttribute("d", d)
    }

    // Update hit areas and X icons (all arrows)
    for (const data of allVisibleArrows) {
      const d = computePath(data.arrow, editorsRef, containerRect)
      if (!d) continue
      hitPathRefs.current.get(data.arrowId)?.setAttribute("d", d)

      // Update X icon position if hovered
      const xIcon = xIconRefs.current.get(data.arrowId)
      if (xIcon) {
        const fromCenter = getWordCenter(data.arrow.from, editorsRef, containerRect)
        const toCenter = getWordCenter(data.arrow.to, editorsRef, containerRect)
        if (fromCenter && toCenter) {
          const mx = (fromCenter.cx + toCenter.cx) / 2
          const my = (fromCenter.cy + toCenter.cy) / 2
          xIcon.setAttribute("transform", `translate(${mx}, ${my})`)
        }
      }
    }

    // Update preview
    if (drawingState && drawingColor) {
      updatePreviewPositions(containerRect)
    }
  }, [crossEditorArrows, allVisibleArrows, editorsRef, containerRef, drawingState, drawingColor])

  // Refs for preview elements
  const previewPathRef = useRef<SVGPathElement | null>(null)
  const previewRectRef = useRef<SVGRectElement | null>(null)
  const previewMarkerPolygonRef = useRef<SVGPolygonElement | null>(null)

  const updatePreviewPositions = useCallback((containerRect: DOMRect) => {
    if (!drawingState) return
    if (sectionVisibility[drawingState.anchor.editorIndex] === false) return
    if (sectionVisibility[drawingState.cursor.editorIndex] === false) return

    const fromCenter = getWordCenter(drawingState.anchor, editorsRef, containerRect)
    const toCenter = getWordCenter(drawingState.cursor, editorsRef, containerRect)
    if (!fromCenter || !toCenter) return

    // Update anchor rect
    const anchorRect = getWordRect(drawingState.anchor, editorsRef, containerRect)
    if (anchorRect && previewRectRef.current) {
      previewRectRef.current.setAttribute("x", String(anchorRect.x))
      previewRectRef.current.setAttribute("y", String(anchorRect.y))
      previewRectRef.current.setAttribute("width", String(anchorRect.width))
      previewRectRef.current.setAttribute("height", String(anchorRect.height))
    }

    // Update preview arrow path
    if (fromCenter.cx !== toCenter.cx || fromCenter.cy !== toCenter.cy) {
      const mx = (fromCenter.cx + toCenter.cx) / 2
      const my = (fromCenter.cy + toCenter.cy) / 2
      const d = `M ${fromCenter.cx} ${fromCenter.cy} L ${mx} ${my} L ${toCenter.cx} ${toCenter.cy}`
      previewPathRef.current?.setAttribute("d", d)
    }
  }, [drawingState, editorsRef, sectionVisibility])

  // After React renders (structural changes), compute initial positions
  useLayoutEffect(() => {
    updatePositions()
  })

  // Scroll → imperative update (no React re-render)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onScroll = () => updatePositions()
    container.addEventListener("scroll", onScroll, true)
    return () => container.removeEventListener("scroll", onScroll, true)
  }, [containerRef, updatePositions])

  // Resize → structural re-render (arrow positions shift)
  const recalcStructural = useCallback(() => setStructuralTick((t) => t + 1), [])
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ro = new ResizeObserver(recalcStructural)
    ro.observe(container)
    window.addEventListener("resize", recalcStructural)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", recalcStructural)
    }
  }, [containerRef, recalcStructural])

  // Structural recalc on layer/drawing/visibility changes
  useEffect(() => {
    recalcStructural()
  }, [layers, drawingState, sectionVisibility, recalcStructural])

  const blendArrow = useCallback(
    (hex: string) => blendWithBackground(hex, ARROW_OPACITY, isDarkMode),
    [isDarkMode]
  )

  // Preview data for React rendering structure (show/hide elements)
  const previewStructure = useMemo(() => {
    if (!drawingState || !drawingColor) return null
    if (sectionVisibility[drawingState.anchor.editorIndex] === false) return null
    if (sectionVisibility[drawingState.cursor.editorIndex] === false) return null

    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return null

    const fromCenter = getWordCenter(drawingState.anchor, editorsRef, containerRect)
    const toCenter = getWordCenter(drawingState.cursor, editorsRef, containerRect)
    if (!fromCenter || !toCenter) return null

    const anchorRect = getWordRect(drawingState.anchor, editorsRef, containerRect)
    const samePoint = fromCenter.cx === toCenter.cx && fromCenter.cy === toCenter.cy

    return { anchorRect, hasLine: !samePoint }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingState, drawingColor, editorsRef, containerRef, sectionVisibility, structuralTick])

  // Force a void read of structuralTick so the dependency is used
  void structuralTick

  return (
    <>
      {/* Visual layer: blend mode applied here for highlighter effect */}
      <svg
        data-testid="arrow-overlay"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: "100%", height: "100%", mixBlendMode: isDarkMode ? "screen" : "multiply" }}
      >
        <defs>
          {crossEditorArrows.map((data) => (
            <marker
              key={`marker-${data.arrowId}`}
              id={`arrowhead-${data.arrowId}`}
              markerWidth="8"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={data.color} />
            </marker>
          ))}
          {previewStructure && drawingColor && (
            <marker
              id="arrowhead-preview"
              markerWidth="8"
              markerHeight="6"
              refX="4"
              refY="3"
              orient="auto"
            >
              <polygon
                ref={previewMarkerPolygonRef}
                points="0 0, 8 3, 0 6"
                fill={blendArrow(drawingColor)}
              />
            </marker>
          )}
        </defs>

        {crossEditorArrows.map((data) => (
          <g key={data.arrowId} opacity={ARROW_OPACITY}>
            <path
              ref={(el) => {
                if (el) visualPathRefs.current.set(data.arrowId, el)
                else visualPathRefs.current.delete(data.arrowId)
              }}
              data-testid="arrow-line"
              d=""
              stroke={data.color}
              strokeWidth={2}
              fill="none"
              markerMid={hoveredArrowId === data.arrowId ? undefined : `url(#arrowhead-${data.arrowId})`}
            />
          </g>
        ))}

        {previewStructure && drawingColor && (
          <g opacity={ARROW_OPACITY}>
            {previewStructure.anchorRect && (
              <rect
                ref={previewRectRef}
                data-testid="preview-anchor-rect"
                x={previewStructure.anchorRect.x}
                y={previewStructure.anchorRect.y}
                width={previewStructure.anchorRect.width}
                height={previewStructure.anchorRect.height}
                fill={drawingColor}
              />
            )}
            {previewStructure.hasLine && (
              <path
                ref={previewPathRef}
                data-testid="preview-arrow"
                d=""
                stroke={blendArrow(drawingColor)}
                strokeWidth={2}
                strokeDasharray="6 4"
                fill="none"
                markerMid="url(#arrowhead-preview)"
              />
            )}
          </g>
        )}
      </svg>

      {/* Interaction layer: separate SVG without blend mode so pointer events work */}
      <svg
        data-testid="arrow-interaction-layer"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: "100%", height: "100%" }}
      >
        {allVisibleArrows.map((data) => {
          const isHovered = hoveredArrowId === data.arrowId
          const strokeColor = blendArrow(data.color)
          return (
            <g key={data.arrowId}>
              <path
                ref={(el) => {
                  if (el) hitPathRefs.current.set(data.arrowId, el)
                  else hitPathRefs.current.delete(data.arrowId)
                }}
                data-testid="arrow-hit-area"
                d=""
                stroke="transparent"
                strokeWidth={12}
                fill="none"
                style={{
                  pointerEvents: "auto",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHoveredArrowId(data.arrowId)}
                onMouseLeave={() => setHoveredArrowId(null)}
                onClick={() => removeArrow(data.layerId, data.arrowId)}
              />
              {isHovered && (
                <g
                  ref={(el) => {
                    if (el) xIconRefs.current.set(data.arrowId, el)
                    else xIconRefs.current.delete(data.arrowId)
                  }}
                  transform="translate(0, 0)"
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
