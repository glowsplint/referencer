// Side panel that renders annotation cards alongside the editor, connected by
// SVG lines to their corresponding highlights. Resolves vertical overlaps so
// cards don't stack on top of each other, and draws connector lines from each
// highlight's right edge to its card using blended colors.
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import type { Layer, EditingAnnotation } from "@/types/editor";
import { useAllHighlightPositions } from "@/hooks/use-all-highlight-positions";
import { resolveAnnotationOverlaps } from "@/lib/resolve-annotation-overlaps";
import { blendWithBackground } from "@/lib/color";
import { AnnotationCard } from "./AnnotationCard";

interface AnnotationPanelProps {
  layers: Layer[];
  editorsRef: React.RefObject<Map<number, Editor>>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  editingAnnotation: EditingAnnotation | null;
  onAnnotationChange: (layerId: string, highlightId: string, annotation: string) => void;
  onAnnotationBlur: (layerId: string, highlightId: string, annotation: string) => void;
  onAnnotationClick: (layerId: string, highlightId: string) => void;
  isDarkMode: boolean;
  sectionVisibility: boolean[];
  collapsedIds?: Set<string>;
  onToggleCollapse?: (highlightId: string) => void;
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
}

const PANEL_WIDTH = 224; // w-56
const CONNECTOR_GAP = 8; // px between highlight right edge and connector line start
const CONNECTOR_Y_OFFSET = 10; // vertically center connector on text line (~half line height)
const PANEL_LEFT_PAD = 16; // left-4 (Tailwind) — connector endpoint inside panel
const CONNECTOR_OPACITY = 0.4;

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
  collapsedIds,
  onToggleCollapse,
  onCollapseAll,
  onExpandAll,
}: AnnotationPanelProps) {
  const positions = useAllHighlightPositions(editorsRef, layers, containerRef, sectionVisibility);

  // Track actual rendered card heights via ResizeObserver so the overlap
  // resolver uses real sizes instead of the fixed 72px fallback.
  const [cardHeights, setCardHeights] = useState<Map<string, number>>(() => new Map());
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(
    () => () => {
      observerRef.current?.disconnect();
    },
    [],
  );

  const observeCard = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    if (!observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        setCardHeights((prev) => {
          let next: Map<string, number> | null = null;
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.highlightId;
            if (!id) continue;
            const h = (entry.target as HTMLElement).offsetHeight;
            if (prev.get(id) !== h) {
              if (!next) next = new Map(prev);
              next.set(id, h);
            }
          }
          return next ?? prev;
        });
      });
    }
    observerRef.current.observe(el);
  }, []);

  const resolvedPositions = useMemo(() => {
    return resolveAnnotationOverlaps(
      positions.map((p) => ({ id: p.highlightId, desiredTop: p.top })),
      cardHeights,
    );
  }, [positions, cardHeights]);

  // Precompute fast lookups from highlight ID -> color, layerId, annotation text.
  // Only includes annotations from visible layers so hidden layers don't render.
  const highlightLookup = useMemo(() => {
    const color = new Map<string, string>();
    const layerId = new Map<string, string>();
    const annotation = new Map<string, string>();
    const lastEdited = new Map<string, number | undefined>();
    for (const layer of layers) {
      for (const h of layer.highlights) {
        color.set(h.id, layer.color);
        layerId.set(h.id, layer.id);
        lastEdited.set(h.id, h.lastEdited);
        if (layer.visible) annotation.set(h.id, h.annotation);
      }
    }
    return { color, layerId, annotation, lastEdited };
  }, [layers]);

  const positionByHighlightId = useMemo(() => {
    const map = new Map<string, { top: number; rightEdge: number }>();
    for (const p of positions) {
      map.set(p.highlightId, { top: p.top, rightEdge: p.rightEdge });
    }
    return map;
  }, [positions]);

  const containerWidth = containerRef.current?.offsetWidth ?? 0;

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
          {(onCollapseAll || onExpandAll) && (
            <div className="flex justify-end gap-1 px-1 py-0.5">
              {onCollapseAll && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={onCollapseAll}
                >
                  Collapse all
                </button>
              )}
              {onExpandAll && (
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  onClick={onExpandAll}
                >
                  Expand all
                </button>
              )}
            </div>
          )}
          {/* SVG connector lines - overflow visible to extend into editor area */}
          <svg
            className="pointer-events-none absolute inset-0"
            style={{
              width: "100%",
              height: "100%",
              overflow: "visible",
              mixBlendMode: isDarkMode ? "screen" : "multiply",
            }}
          >
            {resolvedPositions.map((resolved) => {
              const original = positionByHighlightId.get(resolved.id);
              if (!original) return null;
              const color = highlightLookup.color.get(resolved.id);
              if (!color) return null;

              // x1 is relative to the panel - the rightEdge is relative to the container,
              // so we need to negate it from the panel's perspective (panel is to the right of container)
              const x1 = original.rightEdge - containerWidth - CONNECTOR_GAP;
              const y1 = original.top + CONNECTOR_Y_OFFSET;
              const x2 = PANEL_LEFT_PAD;
              const y2 = resolved.top + CONNECTOR_Y_OFFSET;

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
              );
            })}
          </svg>

          {/* Annotation cards */}
          <div className="absolute top-0 left-4 right-0 z-10 pointer-events-auto">
            {resolvedPositions.map((resolved) => {
              const color = highlightLookup.color.get(resolved.id) ?? "#888";
              const layerId = highlightLookup.layerId.get(resolved.id) ?? "";
              const annotation = highlightLookup.annotation.get(resolved.id) ?? "";
              const isEditing =
                editingAnnotation?.highlightId === resolved.id &&
                editingAnnotation?.layerId === layerId;

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
                  cardRef={observeCard}
                  lastEdited={highlightLookup.lastEdited.get(resolved.id)}
                  isCollapsed={collapsedIds?.has(resolved.id)}
                  onToggleCollapse={onToggleCollapse}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
