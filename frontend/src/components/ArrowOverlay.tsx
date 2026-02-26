// Renders all arrow connectors between annotations as SVG overlays. Handles two
// rendering modes: container-level SVG for the gap between editors, and per-wrapper
// SVGs injected into each editor's scroll container so arrows rubber-band with
// content during scroll. Also renders the interactive hit areas, selection rings,
// hover highlights, delete icons, and the live preview while drawing a new arrow.
import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from "react";
import type { ArrowOverlayProps, CrossEditorArrow } from "@/components/arrow-overlay/types";
import { getWordCenter, getWordRect } from "@/lib/tiptap/nearest-word";
import { blendWithBackground } from "@/lib/color";
import { getArrowLinesView } from "@/lib/tiptap/extensions/arrow-lines-plugin";
import { ARROW_OPACITY } from "@/constants/arrow";
import { ArrowVisualLayer } from "./arrow-overlay/ArrowVisualLayer";
import {
  syncWrapperSvgs,
  destroyWrapperSvgs,
  updatePositions as updateSVGPositions,
  type WrapperSVGState,
  type PositionUpdateRefs,
  type DrawWrapperOpts,
} from "@/lib/arrow/ArrowSVGManager";

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
  const [hoveredArrowId, setHoveredArrowId] = useState<string | null>(null);
  // Structural tick — only for structural changes (layers, visibility, preview), NOT scroll
  const [structuralTick, setStructuralTick] = useState(0);

  // Propagate hoveredArrowId to within-editor plugin views so they hide arrowheads
  useEffect(() => {
    for (const editor of editorsRef.current.values()) {
      if (editor.isDestroyed) continue;
      getArrowLinesView(editor.view)?.setHoveredArrowId(hoveredArrowId);
    }
  }, [hoveredArrowId, editorsRef]);

  // Which editor the mouse is currently over (for wrapper-level arrow rendering)
  const [hoveredEditorIndex, setHoveredEditorIndex] = useState<number | null>(null);

  // Refs for imperative path updates on scroll
  const visualPathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const visualPathRefs2 = useRef<Map<string, SVGPathElement>>(new Map());
  const hitPathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const xIconRefs = useRef<Map<string, SVGGElement>>(new Map());
  const selectionPathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const hoverPathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const arrowGroupRefs = useRef<Map<string, SVGGElement>>(new Map());

  // Ref for the container-level visual SVG and its gap clip path
  const containerVisualSvgRef = useRef<SVGSVGElement | null>(null);
  const gapClipPathRef = useRef<SVGPathElement | null>(null);

  // Per-wrapper SVG state (managed imperatively by ArrowSVGManager)
  const wrapperSvgState = useRef<WrapperSVGState>({
    svgs: new Map(),
    observers: new Map(),
  });

  // Refs for preview elements
  const previewPathRef = useRef<SVGPathElement | null>(null);
  const previewRectRef = useRef<SVGRectElement | null>(null);
  const previewMarkerPolygonRef = useRef<SVGPolygonElement | null>(null);

  // All visible arrows (for interaction layer — handles hit areas for ALL arrows)
  const allVisibleArrows = useMemo(() => {
    if (!isLocked) return [];
    const result: CrossEditorArrow[] = [];
    for (const layer of layers) {
      if (!layer.visible) continue;
      for (const arrow of layer.arrows) {
        if (arrow.visible === false) continue;
        if (sectionVisibility[arrow.from.editorIndex] === false) continue;
        if (sectionVisibility[arrow.to.editorIndex] === false) continue;
        result.push({
          layerId: layer.id,
          arrowId: arrow.id,
          color: layer.color,
          arrowStyle: arrow.arrowStyle ?? "solid",
          arrow,
        });
      }
    }
    return result;
  }, [layers, sectionVisibility, isLocked]);

  // Cross-editor arrows only (for visual rendering — within-editor visuals are in the plugin)
  const crossEditorArrows = useMemo(
    () => allVisibleArrows.filter((a) => a.arrow.from.editorIndex !== a.arrow.to.editorIndex),
    [allVisibleArrows],
  );

  // Track which editor is hovered via mouseenter/mouseleave on editor wrappers
  useEffect(() => {
    const editors = editorsRef.current;
    const cleanups: (() => void)[] = [];

    for (const [index, editor] of editors) {
      if (editor.isDestroyed) continue;
      const wrapper = editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null;
      if (!wrapper) continue;

      const onEnter = () => setHoveredEditorIndex(index);
      const onLeave = () => setHoveredEditorIndex((prev) => (prev === index ? null : prev));

      wrapper.addEventListener("mouseenter", onEnter);
      wrapper.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        wrapper.removeEventListener("mouseenter", onEnter);
        wrapper.removeEventListener("mouseleave", onLeave);
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [editorsRef, structuralTick]);

  // Pre-mount per-wrapper SVGs for cross-editor arrow rendering
  useEffect(() => {
    syncWrapperSvgs(wrapperSvgState.current, editorsRef.current, isDarkMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorsRef, structuralTick]);

  // Clean up all wrapper SVGs on unmount
  useEffect(() => {
    const state = wrapperSvgState.current;
    return () => destroyWrapperSvgs(state);
  }, []);

  // Sync dark mode on wrapper SVGs
  useEffect(() => {
    const blendMode = isDarkMode ? "screen" : "multiply";
    for (const svg of wrapperSvgState.current.svgs.values()) {
      svg.style.mixBlendMode = blendMode;
    }
  }, [isDarkMode]);

  // Build draw-wrapper options (memoized for the manager)
  const drawWrapperOpts = useMemo<DrawWrapperOpts>(
    () => ({
      editorsRef,
      hoveredArrowId,
      selectedArrow,
      isDarkMode,
      activeTool,
      hideOffscreenArrows,
    }),
    [editorsRef, hoveredArrowId, selectedArrow, isDarkMode, activeTool, hideOffscreenArrows],
  );

  // Patch SVG attributes imperatively (not via React re-render) for scroll performance
  const updatePositions = useCallback(() => {
    const posRefs: PositionUpdateRefs = {
      visualPathRefs: visualPathRefs.current,
      visualPathRefs2: visualPathRefs2.current,
      hitPathRefs: hitPathRefs.current,
      xIconRefs: xIconRefs.current,
      selectionPathRefs: selectionPathRefs.current,
      hoverPathRefs: hoverPathRefs.current,
      arrowGroupRefs: arrowGroupRefs.current,
      containerVisualSvgRef: containerVisualSvgRef.current,
      gapClipPathRef: gapClipPathRef.current,
      previewPathRef: previewPathRef.current,
      previewRectRef: previewRectRef.current,
    };

    updateSVGPositions(posRefs, {
      crossEditorArrows,
      allVisibleArrows,
      editorsRef,
      containerRef,
      drawingState,
      drawingColor,
      hoveredEditorIndex,
      hideOffscreenArrows,
      activeTool,
      sectionVisibility,
      wrapperSvgState: wrapperSvgState.current,
      drawWrapperOpts,
    });
  }, [
    crossEditorArrows,
    allVisibleArrows,
    editorsRef,
    containerRef,
    drawingState,
    drawingColor,
    hoveredEditorIndex,
    drawWrapperOpts,
    hideOffscreenArrows,
    activeTool,
    sectionVisibility,
  ]);

  // After React renders (structural changes), compute initial positions
  useLayoutEffect(() => {
    updatePositions();
  });

  // Scroll → imperative update (no React re-render)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => updatePositions();
    container.addEventListener("scroll", onScroll, true);
    return () => container.removeEventListener("scroll", onScroll, true);
  }, [containerRef, updatePositions]);

  // Resize → structural re-render (arrow positions shift)
  const recalcStructural = useCallback(() => setStructuralTick((t) => t + 1), []);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(recalcStructural);
    ro.observe(container);
    window.addEventListener("resize", recalcStructural);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalcStructural);
    };
  }, [containerRef, recalcStructural]);

  // Structural recalc on layer/drawing/visibility/selection changes
  useEffect(() => {
    recalcStructural();
  }, [layers, drawingState, sectionVisibility, selectedArrow, recalcStructural]);

  const blendArrow = useCallback(
    (hex: string) => blendWithBackground(hex, ARROW_OPACITY, isDarkMode),
    [isDarkMode],
  );

  // Preview data for React rendering structure (show/hide elements)
  const previewStructure = useMemo(() => {
    if (!drawingState || !drawingColor) return null;
    if (sectionVisibility[drawingState.anchor.editorIndex] === false) return null;
    if (sectionVisibility[drawingState.cursor.editorIndex] === false) return null;

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;

    const fromCenter = getWordCenter(drawingState.anchor, editorsRef, containerRect);
    const toCenter = getWordCenter(drawingState.cursor, editorsRef, containerRect);
    if (!fromCenter || !toCenter) return null;

    const anchorRect = getWordRect(drawingState.anchor, editorsRef, containerRect);
    const samePoint = fromCenter.cx === toCenter.cx && fromCenter.cy === toCenter.cy;

    return { anchorRect, hasLine: !samePoint };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawingState, drawingColor, editorsRef, containerRef, sectionVisibility, structuralTick]);

  return (
    <>
      {/* Visual layer: blend mode applied here for highlighter effect */}
      <ArrowVisualLayer
        ref={containerVisualSvgRef}
        crossEditorArrows={crossEditorArrows}
        previewStructure={previewStructure}
        drawingColor={drawingColor}
        selectedArrow={selectedArrow}
        isDarkMode={isDarkMode}
        blendArrow={blendArrow}
        gapClipPathRef={gapClipPathRef}
        arrowGroupRefs={arrowGroupRefs}
        visualPathRefs={visualPathRefs}
        visualPathRefs2={visualPathRefs2}
        previewPathRef={previewPathRef}
        previewRectRef={previewRectRef}
        previewMarkerPolygonRef={previewMarkerPolygonRef}
      />

      {/* Interaction layer: separate SVG without blend mode so pointer events work */}
      <svg
        data-testid="arrow-interaction-layer"
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: "100%", height: "100%" }}
      >
        {allVisibleArrows.map((data) => {
          const isHovered = hoveredArrowId === data.arrowId;
          const isSelected = selectedArrow?.arrowId === data.arrowId;
          const isEraser = activeTool === "eraser";
          const strokeColor = blendArrow(data.color);
          return (
            <g key={data.arrowId}>
              {isHovered && !isSelected && (
                <path
                  ref={(el) => {
                    if (el) hoverPathRefs.current.set(data.arrowId, el);
                    else hoverPathRefs.current.delete(data.arrowId);
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
                    if (el) selectionPathRefs.current.set(data.arrowId, el);
                    else selectionPathRefs.current.delete(data.arrowId);
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
                  if (el) hitPathRefs.current.set(data.arrowId, el);
                  else hitPathRefs.current.delete(data.arrowId);
                }}
                data-testid="arrow-hit-area"
                d=""
                stroke="transparent"
                strokeWidth={12}
                fill="none"
                style={{
                  pointerEvents:
                    activeTool === "selection" || activeTool === "eraser" ? "auto" : "none",
                  cursor: isEraser ? "inherit" : "pointer",
                }}
                onMouseEnter={(e) => {
                  setHoveredArrowId(data.arrowId);
                  if (isEraser && e.buttons === 1) {
                    removeArrow(data.layerId, data.arrowId);
                    setHoveredArrowId(null);
                  }
                }}
                onMouseLeave={() => setHoveredArrowId(null)}
                onClick={() => {
                  if (isEraser) {
                    removeArrow(data.layerId, data.arrowId);
                    setSelectedArrow(null);
                    setHoveredArrowId(null);
                  } else {
                    setSelectedArrow({ layerId: data.layerId, arrowId: data.arrowId });
                  }
                }}
              />
              {isSelected && (
                <g
                  ref={(el) => {
                    if (el) xIconRefs.current.set(data.arrowId, el);
                    else xIconRefs.current.delete(data.arrowId);
                  }}
                  transform="translate(0, 0)"
                  data-testid="arrow-delete-icon"
                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeArrow(data.layerId, data.arrowId);
                    if (selectedArrow?.arrowId === data.arrowId) {
                      setSelectedArrow(null);
                    }
                    setHoveredArrowId(null);
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
          );
        })}
      </svg>
    </>
  );
}
