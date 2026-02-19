// Renders all arrow connectors between annotations as SVG overlays. Handles two
// rendering modes: container-level SVG for the gap between editors, and per-wrapper
// SVGs injected into each editor's scroll container so arrows rubber-band with
// content during scroll. Also renders the interactive hit areas, selection rings,
// hover highlights, delete icons, and the live preview while drawing a new arrow.
import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react"
import type { Editor } from "@tiptap/react"
import type { Layer, DrawingState, ActiveTool, Arrow, ArrowStyle } from "@/types/editor"
import { getWordCenter, getWordRect, getWordCenterRelativeToWrapper, getWordRectRelativeToWrapper, getClampedWordCenter, getClampedWordCenterRelativeToWrapper } from "@/lib/tiptap/nearest-word"
import { blendWithBackground } from "@/lib/color"
import { getArrowStyleAttrs, computeDoubleLinePaths } from "@/lib/arrow-styles"
import { getArrowLinesView } from "@/lib/tiptap/extensions/arrow-lines-plugin"
import { ARROWHEAD } from "@/constants/arrow"

const ARROW_OPACITY = 0.6
// When an arrow endpoint is scrolled out of its editor's visible viewport,
// the arrow is faded to signal it connects to off-screen content
const ARROW_OPACITY_OFFSCREEN = 0.15
const SVG_NS = "http://www.w3.org/2000/svg"

interface ArrowOverlayProps {
  layers: Layer[]
  drawingState: DrawingState | null
  drawingColor: string | null
  editorsRef: React.RefObject<Map<number, Editor>>
  containerRef: React.RefObject<HTMLDivElement | null>
  removeArrow: (layerId: string, arrowId: string) => void
  selectedArrow: { layerId: string; arrowId: string } | null
  setSelectedArrow: (arrow: { layerId: string; arrowId: string } | null) => void
  activeTool: ActiveTool
  sectionVisibility: boolean[]
  isDarkMode: boolean
  isLocked: boolean
  hideOffscreenArrows: boolean
}

interface CrossEditorArrow {
  layerId: string
  arrowId: string
  color: string
  arrowStyle: ArrowStyle
  arrow: Arrow
}

// Compute SVG path for a cross-editor arrow with endpoints clamped to each editor's
// visible viewport. In rows layout, scrolled-out words would place arrow endpoints
// in the gap between editors ("phantom" area); clamping pins them to the editor edge.
function computeClampedPath(
  arrow: Arrow,
  editorsRef: React.RefObject<Map<number, Editor>>,
  containerRect: DOMRect
): { d: string; anyClamped: boolean; fromCenter: { cx: number; cy: number }; toCenter: { cx: number; cy: number } } | null {
  const from = getClampedWordCenter(arrow.from, editorsRef, containerRect)
  const to = getClampedWordCenter(arrow.to, editorsRef, containerRect)
  if (!from || !to) return null
  const mx = (from.cx + to.cx) / 2
  const my = (from.cy + to.cy) / 2
  return {
    d: `M ${from.cx} ${from.cy} L ${mx} ${my} L ${to.cx} ${to.cy}`,
    anyClamped: from.clamped || to.clamped,
    fromCenter: from,
    toCenter: to,
  }
}

export function ArrowOverlay({
  layers,
  drawingState,
  drawingColor,
  editorsRef,
  containerRef,
  removeArrow,
  selectedArrow,
  setSelectedArrow,
  activeTool,
  sectionVisibility,
  isDarkMode,
  isLocked,
  hideOffscreenArrows,
}: ArrowOverlayProps) {
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null)
  // Structural tick — only for structural changes (layers, visibility, preview), NOT scroll
  const [structuralTick, setStructuralTick] = useState(0)

  // Propagate hoveredArrowId to within-editor plugin views so they hide arrowheads
  useEffect(() => {
    for (const editor of editorsRef.current.values()) {
      getArrowLinesView(editor.view)?.setHoveredArrowId(hoveredArrowId)
    }
  }, [hoveredArrowId, editorsRef])

  // Which editor the mouse is currently over (for wrapper-level arrow rendering)
  const [hoveredEditorIndex, setHoveredEditorIndex] = useState<number | null>(null)

  // Refs for imperative path updates on scroll
  const visualPathRefs = useRef<Map<string, SVGPathElement>>(new Map())
  const visualPathRefs2 = useRef<Map<string, SVGPathElement>>(new Map())
  const hitPathRefs = useRef<Map<string, SVGPathElement>>(new Map())
  const xIconRefs = useRef<Map<string, SVGGElement>>(new Map())
  const selectionPathRefs = useRef<Map<string, SVGPathElement>>(new Map())
  const hoverPathRefs = useRef<Map<string, SVGPathElement>>(new Map())
  const arrowGroupRefs = useRef<Map<string, SVGGElement>>(new Map())

  // Ref for the container-level visual SVG and its gap clip path
  const containerVisualSvgRef = useRef<SVGSVGElement | null>(null)
  const gapClipPathRef = useRef<SVGPathElement | null>(null)

  // Per-wrapper SVGs for rendering cross-editor arrows inside editor scroll containers
  const wrapperSvgRefs = useRef<Map<number, SVGSVGElement>>(new Map())
  const wrapperResizeObservers = useRef<Map<number, ResizeObserver>>(new Map())

  // Cross-editor arrows only (for visual rendering — within-editor visuals are in the plugin)
  const crossEditorArrows = useMemo(() => {
    if (!isLocked) return []
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
          arrowStyle: arrow.arrowStyle ?? "solid",
          arrow,
        })
      }
    }
    return result
  }, [layers, sectionVisibility, isLocked])

  // All visible arrows (for interaction layer — handles hit areas for ALL arrows)
  const allVisibleArrows = useMemo(() => {
    if (!isLocked) return []
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
          arrowStyle: arrow.arrowStyle ?? "solid",
          arrow,
        })
      }
    }
    return result
  }, [layers, sectionVisibility, isLocked])

  // Track which editor is hovered via mouseenter/mouseleave on editor wrappers
  useEffect(() => {
    const editors = editorsRef.current
    const cleanups: (() => void)[] = []

    for (const [index, editor] of editors) {
      const wrapper = editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null
      if (!wrapper) continue

      const onEnter = () => setHoveredEditorIndex(index)
      const onLeave = () => setHoveredEditorIndex((prev) => (prev === index ? null : prev))

      wrapper.addEventListener("mouseenter", onEnter)
      wrapper.addEventListener("mouseleave", onLeave)
      cleanups.push(() => {
        wrapper.removeEventListener("mouseenter", onEnter)
        wrapper.removeEventListener("mouseleave", onLeave)
      })
    }

    return () => cleanups.forEach((fn) => fn())
  }, [editorsRef, structuralTick])

  // Pre-mount per-wrapper SVGs for cross-editor arrow rendering.
  // SVGs are created incrementally and persist — no destroy/recreate cycle
  // that would cause a blank-frame flicker between useEffect cleanup and repaint.
  useEffect(() => {
    const editors = editorsRef.current
    const currentSvgs = wrapperSvgRefs.current
    const currentObservers = wrapperResizeObservers.current

    // Create SVGs for new editors
    for (const [index, editor] of editors) {
      if (currentSvgs.has(index)) continue

      const wrapper = editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null
      if (!wrapper) continue

      const svg = document.createElementNS(SVG_NS, "svg")
      svg.setAttribute("data-testid", `wrapper-arrow-svg-${index}`)
      svg.style.position = "absolute"
      svg.style.top = "0"
      svg.style.left = "0"
      svg.style.pointerEvents = "none"
      svg.style.zIndex = "10"
      svg.style.display = "none"
      svg.style.mixBlendMode = isDarkMode ? "screen" : "multiply"
      svg.style.width = `${wrapper.scrollWidth}px`
      svg.style.height = `${wrapper.scrollHeight}px`

      wrapper.appendChild(svg)
      currentSvgs.set(index, svg)

      const ro = new ResizeObserver(() => {
        svg.style.width = `${wrapper.scrollWidth}px`
        svg.style.height = `${wrapper.scrollHeight}px`
      })
      ro.observe(wrapper)
      currentObservers.set(index, ro)
    }

    // Remove SVGs for editors that no longer exist
    for (const [index, svg] of [...currentSvgs]) {
      if (!editors.has(index)) {
        svg.remove()
        currentSvgs.delete(index)
        currentObservers.get(index)?.disconnect()
        currentObservers.delete(index)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorsRef, structuralTick])

  // Clean up all wrapper SVGs on unmount
  useEffect(() => {
    return () => {
      for (const [index, svg] of wrapperSvgRefs.current) {
        svg.remove()
        wrapperSvgRefs.current.delete(index)
        wrapperResizeObservers.current.get(index)?.disconnect()
        wrapperResizeObservers.current.delete(index)
      }
    }
  }, [])

  // Sync dark mode on wrapper SVGs
  useEffect(() => {
    const blendMode = isDarkMode ? "screen" : "multiply"
    for (const svg of wrapperSvgRefs.current.values()) {
      svg.style.mixBlendMode = blendMode
    }
  }, [isDarkMode])

  // Draw cross-editor arrows into a wrapper SVG imperatively
  const drawIntoWrapperSvg = useCallback((
    svg: SVGSVGElement,
    wrapper: HTMLElement,
    arrows: CrossEditorArrow[],
    drawState: DrawingState | null,
    drawColor: string | null,
  ) => {
    while (svg.firstChild) svg.removeChild(svg.firstChild)

    // Update SVG size to match wrapper content
    svg.style.width = `${wrapper.scrollWidth}px`
    svg.style.height = `${wrapper.scrollHeight}px`

    const defs = document.createElementNS(SVG_NS, "defs")

    for (const data of arrows) {
      const fromResult = getClampedWordCenterRelativeToWrapper(data.arrow.from, editorsRef, wrapper)
      const toResult = getClampedWordCenterRelativeToWrapper(data.arrow.to, editorsRef, wrapper)
      if (!fromResult || !toResult) continue

      const { cx: x1, cy: y1 } = fromResult
      const { cx: x2, cy: y2 } = toResult
      const mx = (x1 + x2) / 2
      const my = (y1 + y2) / 2
      const arrowPath = `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`
      // Fade or hide arrows with off-screen endpoints so they don't draw attention
      // to connections the user can't fully see in the current scroll position
      const isClamped = fromResult.clamped || toResult.clamped
      const arrowOpacity = isClamped ? (hideOffscreenArrows ? 0 : ARROW_OPACITY_OFFSCREEN) : ARROW_OPACITY
      const isHovered = hoveredArrowId === data.arrowId
      const isSelected = selectedArrow?.arrowId === data.arrowId
      const hideMarker = isHovered || isSelected
      const showHoverRing = isHovered && !isSelected

      const marker = document.createElementNS(SVG_NS, "marker")
      marker.setAttribute("id", `wrapper-arrowhead-${data.arrowId}`)
      marker.setAttribute("markerWidth", String(ARROWHEAD.WIDTH))
      marker.setAttribute("markerHeight", String(ARROWHEAD.HEIGHT))
      marker.setAttribute("refX", String(ARROWHEAD.REF_X))
      marker.setAttribute("refY", String(ARROWHEAD.REF_Y))
      marker.setAttribute("orient", "auto")
      const polygon = document.createElementNS(SVG_NS, "polygon")
      polygon.setAttribute("points", ARROWHEAD.POINTS)
      polygon.setAttribute("fill", data.color)
      marker.appendChild(polygon)
      defs.appendChild(marker)

      const g = document.createElementNS(SVG_NS, "g")
      g.setAttribute("opacity", String(arrowOpacity))
      const styleAttrs = getArrowStyleAttrs(data.arrowStyle)

      if (styleAttrs.isDouble) {
        const [pathA, pathB] = computeDoubleLinePaths(x1, y1, mx, my, x2, y2)
        for (const d of [pathA, pathB]) {
          const p = document.createElementNS(SVG_NS, "path")
          p.setAttribute("data-testid", "wrapper-arrow-line")
          p.setAttribute("d", d)
          p.setAttribute("stroke", data.color)
          p.setAttribute("stroke-width", String(styleAttrs.strokeWidth))
          p.setAttribute("fill", "none")
          g.appendChild(p)
        }
        if (!hideMarker) {
          const markerPath = document.createElementNS(SVG_NS, "path")
          markerPath.setAttribute("d", arrowPath)
          markerPath.setAttribute("stroke", "none")
          markerPath.setAttribute("stroke-width", "2")
          markerPath.setAttribute("fill", "none")
          markerPath.setAttribute("marker-mid", `url(#wrapper-arrowhead-${data.arrowId})`)
          g.appendChild(markerPath)
        }
      } else {
        const path = document.createElementNS(SVG_NS, "path")
        path.setAttribute("data-testid", "wrapper-arrow-line")
        path.setAttribute("d", arrowPath)
        path.setAttribute("stroke", data.color)
        path.setAttribute("stroke-width", String(styleAttrs.strokeWidth))
        path.setAttribute("fill", "none")
        if (styleAttrs.strokeDasharray) {
          path.setAttribute("stroke-dasharray", styleAttrs.strokeDasharray)
        }
        if (!hideMarker) {
          path.setAttribute("marker-mid", `url(#wrapper-arrowhead-${data.arrowId})`)
        }
        g.appendChild(path)
      }
      svg.appendChild(g)

      if (showHoverRing) {
        const isEraser = activeTool === "eraser"
        const hoverRing = document.createElementNS(SVG_NS, "path")
        hoverRing.setAttribute("d", arrowPath)
        hoverRing.setAttribute("stroke", isEraser ? "#ef4444" : data.color)
        hoverRing.setAttribute("stroke-width", "6")
        hoverRing.setAttribute("stroke-opacity", isEraser ? "0.3" : "0.15")
        hoverRing.setAttribute("fill", "none")
        hoverRing.style.pointerEvents = "none"
        svg.appendChild(hoverRing)
      }
    }

    // Preview in wrapper mode
    if (drawState && drawColor) {
      const fromCenter = getWordCenterRelativeToWrapper(drawState.anchor, editorsRef, wrapper)
      const toCenter = getWordCenterRelativeToWrapper(drawState.cursor, editorsRef, wrapper)
      if (fromCenter && toCenter) {
        const blendedColor = blendWithBackground(drawColor, ARROW_OPACITY, isDarkMode)

        // Anchor rect
        const anchorRect = getWordRectRelativeToWrapper(drawState.anchor, editorsRef, wrapper)
        if (anchorRect) {
          const g = document.createElementNS(SVG_NS, "g")
          g.setAttribute("opacity", String(ARROW_OPACITY))
          const rect = document.createElementNS(SVG_NS, "rect")
          rect.setAttribute("data-testid", "wrapper-preview-anchor-rect")
          rect.setAttribute("x", String(anchorRect.x))
          rect.setAttribute("y", String(anchorRect.y))
          rect.setAttribute("width", String(anchorRect.width))
          rect.setAttribute("height", String(anchorRect.height))
          rect.setAttribute("fill", drawColor)
          g.appendChild(rect)
          svg.appendChild(g)
        }

        // Preview arrow path (only if anchor !== cursor)
        if (fromCenter.cx !== toCenter.cx || fromCenter.cy !== toCenter.cy) {
          const previewMarker = document.createElementNS(SVG_NS, "marker")
          previewMarker.setAttribute("id", "wrapper-arrowhead-preview")
          previewMarker.setAttribute("markerWidth", String(ARROWHEAD.WIDTH))
          previewMarker.setAttribute("markerHeight", String(ARROWHEAD.HEIGHT))
          previewMarker.setAttribute("refX", String(ARROWHEAD.REF_X))
          previewMarker.setAttribute("refY", String(ARROWHEAD.REF_Y))
          previewMarker.setAttribute("orient", "auto")
          const previewPoly = document.createElementNS(SVG_NS, "polygon")
          previewPoly.setAttribute("points", ARROWHEAD.POINTS)
          previewPoly.setAttribute("fill", blendedColor)
          previewMarker.appendChild(previewPoly)
          defs.appendChild(previewMarker)

          const { cx: x1, cy: y1 } = fromCenter
          const { cx: x2, cy: y2 } = toCenter
          const mx = (x1 + x2) / 2
          const my = (y1 + y2) / 2
          const d = `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`

          const g = document.createElementNS(SVG_NS, "g")
          g.setAttribute("opacity", String(ARROW_OPACITY))
          const path = document.createElementNS(SVG_NS, "path")
          path.setAttribute("data-testid", "wrapper-preview-arrow")
          path.setAttribute("d", d)
          path.setAttribute("stroke", blendedColor)
          path.setAttribute("stroke-width", "2")
          path.setAttribute("stroke-dasharray", "6 4")
          path.setAttribute("fill", "none")
          path.setAttribute("marker-mid", "url(#wrapper-arrowhead-preview)")
          g.appendChild(path)
          svg.appendChild(g)
        }
      }
    }

    if (defs.children.length > 0) {
      svg.insertBefore(defs, svg.firstChild)
    }
  }, [editorsRef, hoveredArrowId, selectedArrow, isDarkMode, activeTool, hideOffscreenArrows])

  // Patch SVG attributes imperatively (not via React re-render) to avoid frame-skip latency during scroll
  const updatePositions = useCallback(() => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return

    // Suppress wrapper mode during drawing to prevent preview flicker
    // from rapid hoveredEditorIndex changes as the mouse moves between editors
    const activeEditorIndex = drawingState ? null : hoveredEditorIndex

    // Update container visual paths — endpoints are clamped to each editor's visible
    // viewport so arrows don't extend into the gap between editors in rows layout.
    // Opacity is reduced when either endpoint is off-screen.
    for (const data of crossEditorArrows) {
      const result = computeClampedPath(data.arrow, editorsRef, containerRect)
      if (!result) continue

      const opacity = result.anyClamped ? (hideOffscreenArrows ? 0 : ARROW_OPACITY_OFFSCREEN) : ARROW_OPACITY
      arrowGroupRefs.current.get(data.arrowId)?.setAttribute("opacity", String(opacity))

      const styleAttrs = getArrowStyleAttrs(data.arrowStyle)
      if (styleAttrs.isDouble) {
        const { fromCenter, toCenter } = result
        const mx = (fromCenter.cx + toCenter.cx) / 2
        const my = (fromCenter.cy + toCenter.cy) / 2
        const [pathA, pathB] = computeDoubleLinePaths(
          fromCenter.cx, fromCenter.cy, mx, my, toCenter.cx, toCenter.cy
        )
        visualPathRefs.current.get(data.arrowId)?.setAttribute("d", pathA)
        visualPathRefs2.current.get(data.arrowId)?.setAttribute("d", pathB)
      } else {
        visualPathRefs.current.get(data.arrowId)?.setAttribute("d", result.d)
      }
    }

    // Always update container preview
    if (drawingState && drawingColor) {
      updatePreviewPositions(containerRect)
    }

    if (activeEditorIndex !== null) {
      // Wrapper mode: clip container SVG to the gap between editors (evenodd
      // path with holes for each wrapper rect). Wrapper SVGs render inside
      // each editor's scroll container so they rubber-band with content.
      const cw = containerRect.width
      const ch = containerRect.height
      let clipD = `M 0 0 H ${cw} V ${ch} H 0 Z`
      for (const [, editor] of editorsRef.current) {
        const wrapper = editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null
        if (!wrapper) continue
        const wr = wrapper.getBoundingClientRect()
        const x = wr.left - containerRect.left
        const y = wr.top - containerRect.top
        clipD += ` M ${x} ${y} H ${x + wr.width} V ${y + wr.height} H ${x} Z`
      }
      gapClipPathRef.current?.setAttribute("d", clipD)
      containerVisualSvgRef.current?.setAttribute("clip-path", "url(#container-gap-clip)")

      // Show and draw into every wrapper SVG
      for (const [index, svg] of wrapperSvgRefs.current) {
        const editor = editorsRef.current.get(index)
        const wrapper = editor?.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null
        if (!wrapper) {
          svg.style.display = "none"
          continue
        }
        svg.style.display = ""
        drawIntoWrapperSvg(svg, wrapper, crossEditorArrows, drawingState, drawingColor)
      }
    } else {
      // No hover: remove clip, hide all wrapper SVGs
      containerVisualSvgRef.current?.removeAttribute("clip-path")
      for (const svg of wrapperSvgRefs.current.values()) {
        svg.style.display = "none"
      }
    }

    // Update hit areas, selection rings, and X icons — clamped so they match the
    // visual arrow position (prevents clickable areas floating in phantom space)
    for (const data of allVisibleArrows) {
      const result = computeClampedPath(data.arrow, editorsRef, containerRect)
      if (!result) continue

      // When hideOffscreenArrows is on and the arrow is clamped, disable interaction
      const isHidden = hideOffscreenArrows && result.anyClamped
      const hitPath = hitPathRefs.current.get(data.arrowId)
      if (hitPath) {
        hitPath.setAttribute("d", result.d)
        if (isHidden) {
          hitPath.style.pointerEvents = "none"
        } else {
          // Restore React-controlled pointer-events (arrow tool → "none", other tools → "auto")
          hitPath.style.pointerEvents = activeTool === "arrow" ? "none" : "auto"
        }
      }
      selectionPathRefs.current.get(data.arrowId)?.setAttribute("d", result.d)
      hoverPathRefs.current.get(data.arrowId)?.setAttribute("d", result.d)

      const xIcon = xIconRefs.current.get(data.arrowId)
      if (xIcon) {
        const { fromCenter, toCenter } = result
        const mx = (fromCenter.cx + toCenter.cx) / 2
        const my = (fromCenter.cy + toCenter.cy) / 2
        xIcon.setAttribute("transform", `translate(${mx}, ${my})`)
      }
    }
  }, [crossEditorArrows, allVisibleArrows, editorsRef, containerRef, drawingState, drawingColor, hoveredEditorIndex, drawIntoWrapperSvg, hideOffscreenArrows, activeTool])

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

  // Structural recalc on layer/drawing/visibility/selection changes
  useEffect(() => {
    recalcStructural()
  }, [layers, drawingState, sectionVisibility, selectedArrow, recalcStructural])

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
        ref={containerVisualSvgRef}
        data-testid="arrow-overlay"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: "100%", height: "100%", mixBlendMode: isDarkMode ? "screen" : "multiply" }}
      >
        <defs>
          <clipPath id="container-gap-clip">
            <path ref={gapClipPathRef} clipRule="evenodd" d="" />
          </clipPath>
          {crossEditorArrows.map((data) => (
            <marker
              key={`marker-${data.arrowId}`}
              id={`arrowhead-${data.arrowId}`}
              markerWidth={ARROWHEAD.WIDTH}
              markerHeight={ARROWHEAD.HEIGHT}
              refX={ARROWHEAD.REF_X}
              refY={ARROWHEAD.REF_Y}
              orient="auto"
            >
              <polygon points={ARROWHEAD.POINTS} fill={data.color} />
            </marker>
          ))}
          {previewStructure && drawingColor && (
            <marker
              id="arrowhead-preview"
              markerWidth={ARROWHEAD.WIDTH}
              markerHeight={ARROWHEAD.HEIGHT}
              refX={ARROWHEAD.REF_X}
              refY={ARROWHEAD.REF_Y}
              orient="auto"
            >
              <polygon
                ref={previewMarkerPolygonRef}
                points={ARROWHEAD.POINTS}
                fill={blendArrow(drawingColor)}
              />
            </marker>
          )}
        </defs>

        {crossEditorArrows.map((data) => {
          const styleAttrs = getArrowStyleAttrs(data.arrowStyle)
          const isSelected = selectedArrow?.arrowId === data.arrowId
          const hideMarker = isSelected
          if (styleAttrs.isDouble) {
            return (
              <g key={data.arrowId} opacity={ARROW_OPACITY} ref={(el) => {
                if (el) arrowGroupRefs.current.set(data.arrowId, el)
                else arrowGroupRefs.current.delete(data.arrowId)
              }}>
                <path
                  ref={(el) => {
                    if (el) visualPathRefs.current.set(data.arrowId, el)
                    else visualPathRefs.current.delete(data.arrowId)
                  }}
                  data-testid="arrow-line"
                  d=""
                  stroke={data.color}
                  strokeWidth={styleAttrs.strokeWidth}
                  fill="none"
                />
                <path
                  ref={(el) => {
                    if (el) visualPathRefs2.current.set(data.arrowId, el)
                    else visualPathRefs2.current.delete(data.arrowId)
                  }}
                  data-testid="arrow-line"
                  d=""
                  stroke={data.color}
                  strokeWidth={styleAttrs.strokeWidth}
                  fill="none"
                />
                {!hideMarker && (
                  <path
                    d=""
                    stroke="none"
                    fill="none"
                    markerMid={`url(#arrowhead-${data.arrowId})`}
                  />
                )}
              </g>
            )
          }
          return (
            <g key={data.arrowId} opacity={ARROW_OPACITY} ref={(el) => {
              if (el) arrowGroupRefs.current.set(data.arrowId, el)
              else arrowGroupRefs.current.delete(data.arrowId)
            }}>
              <path
                ref={(el) => {
                  if (el) visualPathRefs.current.set(data.arrowId, el)
                  else visualPathRefs.current.delete(data.arrowId)
                }}
                data-testid="arrow-line"
                d=""
                stroke={data.color}
                strokeWidth={styleAttrs.strokeWidth}
                fill="none"
                strokeDasharray={styleAttrs.strokeDasharray ?? undefined}
                markerMid={hideMarker ? undefined : `url(#arrowhead-${data.arrowId})`}
              />
            </g>
          )
        })}

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
          const isSelected = selectedArrow?.arrowId === data.arrowId
          const isEraser = activeTool === "eraser"
          const strokeColor = blendArrow(data.color)
          return (
            <g key={data.arrowId}>
              {isHovered && !isSelected && (
                <path
                  ref={(el) => {
                    if (el) hoverPathRefs.current.set(data.arrowId, el)
                    else hoverPathRefs.current.delete(data.arrowId)
                  }}
                  data-testid="arrow-hover-ring"
                  d=""
                  stroke={isEraser ? "#ef4444" : data.color}
                  strokeWidth={6}
                  strokeOpacity={isEraser ? 0.3 : 0.15}
                  fill="none"
                  style={{ pointerEvents: "none" }}
                />
              )}
              {isSelected && (
                <path
                  ref={(el) => {
                    if (el) selectionPathRefs.current.set(data.arrowId, el)
                    else selectionPathRefs.current.delete(data.arrowId)
                  }}
                  data-testid="arrow-selection-ring"
                  d=""
                  stroke={data.color}
                  strokeWidth={8}
                  strokeOpacity={0.3}
                  fill="none"
                  style={{ pointerEvents: "none" }}
                />
              )}
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
                  pointerEvents: activeTool === "arrow" ? "none" : "auto",
                  cursor: isEraser ? "inherit" : "pointer",
                }}
                onMouseEnter={(e) => {
                  setHoveredArrowId(data.arrowId)
                  if (isEraser && e.buttons === 1) {
                    removeArrow(data.layerId, data.arrowId)
                    setHoveredArrowId(null)
                  }
                }}
                onMouseLeave={() => setHoveredArrowId(null)}
                onClick={() => {
                  if (isEraser) {
                    removeArrow(data.layerId, data.arrowId)
                    setSelectedArrow(null)
                    setHoveredArrowId(null)
                  } else {
                    setSelectedArrow({ layerId: data.layerId, arrowId: data.arrowId })
                  }
                }}
              />
              {isSelected && (
                <g
                  ref={(el) => {
                    if (el) xIconRefs.current.set(data.arrowId, el)
                    else xIconRefs.current.delete(data.arrowId)
                  }}
                  transform="translate(0, 0)"
                  data-testid="arrow-delete-icon"
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeArrow(data.layerId, data.arrowId)
                    if (selectedArrow?.arrowId === data.arrowId) {
                      setSelectedArrow(null)
                    }
                    setHoveredArrowId(null)
                  }}
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
