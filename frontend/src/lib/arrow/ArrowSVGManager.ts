// Imperative SVG manager for cross-editor arrow overlays.
// Handles wrapper SVG lifecycle (create/remove/resize), drawing arrows into
// wrapper SVGs, and patching container + hit-area element positions on scroll.
import type { Editor } from "@tiptap/react";
import type { DrawingState, ActiveTool } from "@/types/editor";
import type { CrossEditorArrow } from "@/components/arrow-overlay/types";
import { ARROW_OPACITY, ARROW_OPACITY_OFFSCREEN, SVG_NS } from "@/constants/arrow";
import { getArrowStyleAttrs, computeDoubleLinePaths } from "@/lib/arrow-styles";
import { blendWithBackground } from "@/lib/color";
import {
  getClampedWordCenterRelativeToWrapper,
  getWordCenterRelativeToWrapper,
  getWordRectRelativeToWrapper,
  getWordCenter,
  getWordRect,
} from "@/lib/tiptap/nearest-word";
import { computeClampedPath } from "@/components/arrow-overlay/arrow-geometry";
import {
  createMarkerElement,
  createArrowPath,
  createMarkerOnlyPath,
  createHoverRingPath,
  createPreviewRect,
  createPreviewArrowPath,
} from "./svg-helpers";

// ── Wrapper SVG lifecycle ──

export interface WrapperSVGState {
  svgs: Map<number, SVGSVGElement>;
  observers: Map<number, ResizeObserver>;
}

/**
 * Sync wrapper SVGs to match the current set of editors. Creates SVGs for
 * new editors and removes SVGs for editors that no longer exist.
 */
export function syncWrapperSvgs(
  state: WrapperSVGState,
  editors: Map<number, Editor>,
  isDarkMode: boolean,
): void {
  const blendMode = isDarkMode ? "screen" : "multiply";

  for (const [index, editor] of editors) {
    if (state.svgs.has(index)) continue;
    if (editor.isDestroyed) continue;

    const wrapper = editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null;
    if (!wrapper) continue;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("data-testid", `wrapper-arrow-svg-${index}`);
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.pointerEvents = "none";
    svg.style.zIndex = "10";
    svg.style.display = "none";
    svg.style.mixBlendMode = blendMode;
    svg.style.width = `${wrapper.scrollWidth}px`;
    svg.style.height = `${wrapper.scrollHeight}px`;

    wrapper.appendChild(svg);
    state.svgs.set(index, svg);

    const ro = new ResizeObserver(() => {
      svg.style.width = `${wrapper.scrollWidth}px`;
      svg.style.height = `${wrapper.scrollHeight}px`;
    });
    ro.observe(wrapper);
    state.observers.set(index, ro);
  }

  for (const [index, svg] of [...state.svgs]) {
    if (!editors.has(index)) {
      svg.remove();
      state.svgs.delete(index);
      state.observers.get(index)?.disconnect();
      state.observers.delete(index);
    }
  }
}

/**
 * Remove all wrapper SVGs and disconnect observers.
 */
export function destroyWrapperSvgs(state: WrapperSVGState): void {
  for (const [index, svg] of state.svgs) {
    svg.remove();
    state.svgs.delete(index);
    state.observers.get(index)?.disconnect();
    state.observers.delete(index);
  }
}

// ── Drawing into wrapper SVGs ──

export interface DrawWrapperOpts {
  editorsRef: React.RefObject<Map<number, Editor>>;
  hoveredArrowId: string | null;
  selectedArrow: { layerId: string; arrowId: string } | null;
  isDarkMode: boolean;
  activeTool: ActiveTool;
  hideOffscreenArrows: boolean;
}

/**
 * Draw cross-editor arrows into a wrapper SVG imperatively (clear + redraw).
 */
export function drawIntoWrapperSvg(
  svg: SVGSVGElement,
  wrapper: HTMLElement,
  arrows: CrossEditorArrow[],
  drawState: DrawingState | null,
  drawColor: string | null,
  opts: DrawWrapperOpts,
): void {
  const { editorsRef, hoveredArrowId, selectedArrow, isDarkMode, activeTool, hideOffscreenArrows } =
    opts;

  while (svg.firstChild) svg.removeChild(svg.firstChild);
  svg.style.width = `${wrapper.scrollWidth}px`;
  svg.style.height = `${wrapper.scrollHeight}px`;

  const defs = document.createElementNS(SVG_NS, "defs");

  for (const data of arrows) {
    const fromResult = getClampedWordCenterRelativeToWrapper(data.arrow.from, editorsRef, wrapper);
    const toResult = getClampedWordCenterRelativeToWrapper(data.arrow.to, editorsRef, wrapper);
    if (!fromResult || !toResult) continue;

    const { cx: x1, cy: y1 } = fromResult;
    const { cx: x2, cy: y2 } = toResult;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const arrowPath = `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`;

    const isClamped = fromResult.clamped || toResult.clamped;
    const arrowOpacity = isClamped
      ? hideOffscreenArrows
        ? 0
        : ARROW_OPACITY_OFFSCREEN
      : ARROW_OPACITY;
    const isHovered = hoveredArrowId === data.arrowId;
    const isSelected = selectedArrow?.arrowId === data.arrowId;
    const hideMarker = isHovered || isSelected;
    const showHoverRing = isHovered && !isSelected;

    const markerId = `wrapper-arrowhead-${data.arrowId}`;
    defs.appendChild(createMarkerElement(markerId, data.color));

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("opacity", String(arrowOpacity));
    const styleAttrs = getArrowStyleAttrs(data.arrowStyle);

    if (styleAttrs.isDouble) {
      const [pathA, pathB] = computeDoubleLinePaths(x1, y1, mx, my, x2, y2);
      for (const d of [pathA, pathB]) {
        g.appendChild(
          createArrowPath(
            d,
            data.color,
            { ...styleAttrs, strokeDasharray: null },
            {
              testId: "wrapper-arrow-line",
            },
          ),
        );
      }
      if (!hideMarker) {
        g.appendChild(createMarkerOnlyPath(arrowPath, markerId));
      }
    } else {
      g.appendChild(
        createArrowPath(arrowPath, data.color, styleAttrs, {
          testId: "wrapper-arrow-line",
          markerId: hideMarker ? undefined : markerId,
        }),
      );
    }
    svg.appendChild(g);

    if (showHoverRing) {
      svg.appendChild(createHoverRingPath(arrowPath, data.color, activeTool === "eraser"));
    }
  }

  // Preview in wrapper mode
  if (drawState && drawColor) {
    const fromCenter = getWordCenterRelativeToWrapper(drawState.anchor, editorsRef, wrapper);
    const toCenter = getWordCenterRelativeToWrapper(drawState.cursor, editorsRef, wrapper);
    if (fromCenter && toCenter) {
      const blendedColor = blendWithBackground(drawColor, ARROW_OPACITY, isDarkMode);

      const anchorRect = getWordRectRelativeToWrapper(drawState.anchor, editorsRef, wrapper);
      if (anchorRect) {
        svg.appendChild(createPreviewRect(anchorRect, drawColor, ARROW_OPACITY));
      }

      if (fromCenter.cx !== toCenter.cx || fromCenter.cy !== toCenter.cy) {
        const previewMarkerId = "wrapper-arrowhead-preview";
        defs.appendChild(createMarkerElement(previewMarkerId, blendedColor));

        const { cx: x1, cy: y1 } = fromCenter;
        const { cx: x2, cy: y2 } = toCenter;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const d = `M ${x1} ${y1} L ${mx} ${my} L ${x2} ${y2}`;

        svg.appendChild(createPreviewArrowPath(d, blendedColor, ARROW_OPACITY, previewMarkerId));
      }
    }
  }

  if (defs.children.length > 0) {
    svg.insertBefore(defs, svg.firstChild);
  }
}

// ── Position updates (scroll handler) ──

export interface PositionUpdateRefs {
  visualPathRefs: Map<string, SVGPathElement>;
  visualPathRefs2: Map<string, SVGPathElement>;
  hitPathRefs: Map<string, SVGPathElement>;
  xIconRefs: Map<string, SVGGElement>;
  selectionPathRefs: Map<string, SVGPathElement>;
  hoverPathRefs: Map<string, SVGPathElement>;
  arrowGroupRefs: Map<string, SVGGElement>;
  containerVisualSvgRef: SVGSVGElement | null;
  gapClipPathRef: SVGPathElement | null;
  previewPathRef: SVGPathElement | null;
  previewRectRef: SVGRectElement | null;
}

export interface PositionUpdateOpts {
  crossEditorArrows: CrossEditorArrow[];
  allVisibleArrows: CrossEditorArrow[];
  editorsRef: React.RefObject<Map<number, Editor>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  drawingState: DrawingState | null;
  drawingColor: string | null;
  hoveredEditorIndex: number | null;
  hideOffscreenArrows: boolean;
  activeTool: ActiveTool;
  sectionVisibility: boolean[];
  wrapperSvgState: WrapperSVGState;
  drawWrapperOpts: DrawWrapperOpts;
}

/**
 * Update preview element positions imperatively (no React re-render).
 */
export function updatePreviewPositions(
  containerRect: DOMRect,
  drawingState: DrawingState,
  editorsRef: React.RefObject<Map<number, Editor>>,
  sectionVisibility: boolean[],
  previewPathRef: SVGPathElement | null,
  previewRectRef: SVGRectElement | null,
): void {
  if (sectionVisibility[drawingState.anchor.editorIndex] === false) return;
  if (sectionVisibility[drawingState.cursor.editorIndex] === false) return;

  const fromCenter = getWordCenter(drawingState.anchor, editorsRef, containerRect);
  const toCenter = getWordCenter(drawingState.cursor, editorsRef, containerRect);
  if (!fromCenter || !toCenter) return;

  const anchorRect = getWordRect(drawingState.anchor, editorsRef, containerRect);
  if (anchorRect && previewRectRef) {
    previewRectRef.setAttribute("x", String(anchorRect.x));
    previewRectRef.setAttribute("y", String(anchorRect.y));
    previewRectRef.setAttribute("width", String(anchorRect.width));
    previewRectRef.setAttribute("height", String(anchorRect.height));
  }

  if (fromCenter.cx !== toCenter.cx || fromCenter.cy !== toCenter.cy) {
    const mx = (fromCenter.cx + toCenter.cx) / 2;
    const my = (fromCenter.cy + toCenter.cy) / 2;
    const d = `M ${fromCenter.cx} ${fromCenter.cy} L ${mx} ${my} L ${toCenter.cx} ${toCenter.cy}`;
    previewPathRef?.setAttribute("d", d);
  }
}

/**
 * Patch all SVG element positions imperatively on scroll / layout change.
 * Updates container visual paths, wrapper SVGs, and interaction hit areas.
 */
export function updatePositions(refs: PositionUpdateRefs, opts: PositionUpdateOpts): void {
  const containerRect = opts.containerRef.current?.getBoundingClientRect();
  if (!containerRect) return;

  const activeEditorIndex = opts.drawingState ? null : opts.hoveredEditorIndex;

  // Update container visual paths
  for (const data of opts.crossEditorArrows) {
    const result = computeClampedPath(data.arrow, opts.editorsRef, containerRect);
    if (!result) continue;

    const opacity = result.anyClamped
      ? opts.hideOffscreenArrows
        ? 0
        : ARROW_OPACITY_OFFSCREEN
      : ARROW_OPACITY;
    refs.arrowGroupRefs.get(data.arrowId)?.setAttribute("opacity", String(opacity));

    const styleAttrs = getArrowStyleAttrs(data.arrowStyle);
    if (styleAttrs.isDouble) {
      const { fromCenter, toCenter } = result;
      const mx = (fromCenter.cx + toCenter.cx) / 2;
      const my = (fromCenter.cy + toCenter.cy) / 2;
      const [pathA, pathB] = computeDoubleLinePaths(
        fromCenter.cx,
        fromCenter.cy,
        mx,
        my,
        toCenter.cx,
        toCenter.cy,
      );
      refs.visualPathRefs.get(data.arrowId)?.setAttribute("d", pathA);
      refs.visualPathRefs2.get(data.arrowId)?.setAttribute("d", pathB);
    } else {
      refs.visualPathRefs.get(data.arrowId)?.setAttribute("d", result.d);
    }
  }

  // Always update container preview
  if (opts.drawingState && opts.drawingColor) {
    updatePreviewPositions(
      containerRect,
      opts.drawingState,
      opts.editorsRef,
      opts.sectionVisibility,
      refs.previewPathRef,
      refs.previewRectRef,
    );
  }

  if (activeEditorIndex !== null) {
    // Wrapper mode: clip container SVG to the gap between editors
    const cw = containerRect.width;
    const ch = containerRect.height;
    let clipD = `M 0 0 H ${cw} V ${ch} H 0 Z`;
    for (const [, editor] of opts.editorsRef.current) {
      if (editor.isDestroyed) continue;
      const wrapper = editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null;
      if (!wrapper) continue;
      const wr = wrapper.getBoundingClientRect();
      const x = wr.left - containerRect.left;
      const y = wr.top - containerRect.top;
      clipD += ` M ${x} ${y} H ${x + wr.width} V ${y + wr.height} H ${x} Z`;
    }
    refs.gapClipPathRef?.setAttribute("d", clipD);
    refs.containerVisualSvgRef?.setAttribute("clip-path", "url(#container-gap-clip)");

    // Show and draw into every wrapper SVG
    for (const [index, svg] of opts.wrapperSvgState.svgs) {
      const editor = opts.editorsRef.current.get(index);
      const wrapper =
        editor && !editor.isDestroyed
          ? (editor.view.dom.closest(".simple-editor-wrapper") as HTMLElement | null)
          : null;
      if (!wrapper) {
        svg.style.display = "none";
        continue;
      }
      svg.style.display = "";
      drawIntoWrapperSvg(
        svg,
        wrapper,
        opts.crossEditorArrows,
        opts.drawingState,
        opts.drawingColor,
        opts.drawWrapperOpts,
      );
    }
  } else {
    // No hover: remove clip, hide all wrapper SVGs
    refs.containerVisualSvgRef?.removeAttribute("clip-path");
    for (const svg of opts.wrapperSvgState.svgs.values()) {
      svg.style.display = "none";
    }
  }

  // Update hit areas, selection rings, and X icons
  for (const data of opts.allVisibleArrows) {
    const result = computeClampedPath(data.arrow, opts.editorsRef, containerRect);
    if (!result) continue;

    const isHidden = opts.hideOffscreenArrows && result.anyClamped;
    const hitPath = refs.hitPathRefs.get(data.arrowId);
    if (hitPath) {
      hitPath.setAttribute("d", result.d);
      if (isHidden) {
        hitPath.style.pointerEvents = "none";
      } else {
        hitPath.style.pointerEvents =
          opts.activeTool === "selection" || opts.activeTool === "eraser" ? "auto" : "none";
      }
    }
    refs.selectionPathRefs.get(data.arrowId)?.setAttribute("d", result.d);
    refs.hoverPathRefs.get(data.arrowId)?.setAttribute("d", result.d);

    const xIcon = refs.xIconRefs.get(data.arrowId);
    if (xIcon) {
      const { fromCenter, toCenter } = result;
      const mx = (fromCenter.cx + toCenter.cx) / 2;
      const my = (fromCenter.cy + toCenter.cy) / 2;
      xIcon.setAttribute("transform", `translate(${mx}, ${my})`);
    }
  }
}
