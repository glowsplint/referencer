// Renders the container-level visual SVG layer for cross-editor arrows.
// Uses mix-blend-mode (multiply/screen) for highlighter effect.
// Arrow paths are positioned imperatively via refs for scroll performance.
import { forwardRef } from "react";
import type { CrossEditorArrow } from "./types";
import { getArrowStyleAttrs } from "@/lib/arrow-styles";
import { ARROWHEAD, ARROW_OPACITY } from "@/constants/arrow";

interface ArrowVisualLayerProps {
  crossEditorArrows: CrossEditorArrow[];
  previewStructure: {
    anchorRect: { x: number; y: number; width: number; height: number } | null;
    hasLine: boolean;
  } | null;
  drawingColor: string | null;
  selectedArrow: { layerId: string; arrowId: string } | null;
  isDarkMode: boolean;
  blendArrow: (hex: string) => string;
  // Refs
  gapClipPathRef: React.RefObject<SVGPathElement | null>;
  arrowGroupRefs: React.RefObject<Map<string, SVGGElement>>;
  visualPathRefs: React.RefObject<Map<string, SVGPathElement>>;
  visualPathRefs2: React.RefObject<Map<string, SVGPathElement>>;
  previewPathRef: React.RefObject<SVGPathElement | null>;
  previewRectRef: React.RefObject<SVGRectElement | null>;
  previewMarkerPolygonRef: React.RefObject<SVGPolygonElement | null>;
}

export const ArrowVisualLayer = forwardRef<SVGSVGElement, ArrowVisualLayerProps>(
  function ArrowVisualLayer(
    {
      crossEditorArrows,
      previewStructure,
      drawingColor,
      selectedArrow,
      isDarkMode,
      blendArrow,
      gapClipPathRef,
      arrowGroupRefs,
      visualPathRefs,
      visualPathRefs2,
      previewPathRef,
      previewRectRef,
      previewMarkerPolygonRef,
    },
    ref,
  ) {
    return (
      <svg
        ref={ref}
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
          const styleAttrs = getArrowStyleAttrs(data.arrowStyle);
          const isSelected = selectedArrow?.arrowId === data.arrowId;
          const hideMarker = isSelected;
          if (styleAttrs.isDouble) {
            return (
              <g
                key={data.arrowId}
                opacity={ARROW_OPACITY}
                ref={(el) => {
                  if (el) arrowGroupRefs.current.set(data.arrowId, el);
                  else arrowGroupRefs.current.delete(data.arrowId);
                }}
              >
                <path
                  ref={(el) => {
                    if (el) visualPathRefs.current.set(data.arrowId, el);
                    else visualPathRefs.current.delete(data.arrowId);
                  }}
                  data-testid="arrow-line"
                  d=""
                  stroke={data.color}
                  strokeWidth={styleAttrs.strokeWidth}
                  fill="none"
                />
                <path
                  ref={(el) => {
                    if (el) visualPathRefs2.current.set(data.arrowId, el);
                    else visualPathRefs2.current.delete(data.arrowId);
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
            );
          }
          return (
            <g
              key={data.arrowId}
              opacity={ARROW_OPACITY}
              ref={(el) => {
                if (el) arrowGroupRefs.current.set(data.arrowId, el);
                else arrowGroupRefs.current.delete(data.arrowId);
              }}
            >
              <path
                ref={(el) => {
                  if (el) visualPathRefs.current.set(data.arrowId, el);
                  else visualPathRefs.current.delete(data.arrowId);
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
          );
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
    );
  },
);
