// Full-screen portal overlay with a spotlight cutout around the target element.
// Dims the page, blocks interaction outside the tooltip, and positions the
// TourTooltip via @floating-ui/react.
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react";
import type { TourStep } from "@/hooks/ui/use-tour-engine";
import { useSpotlightRect } from "@/hooks/ui/use-spotlight-rect";
import { TourTooltip } from "./TourTooltip";

interface TourOverlayProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

function buildClipPath(rect: DOMRect | null): string {
  if (!rect) {
    // No cutout — full dim overlay
    return "none";
  }

  const { x, y, width: w, height: h } = rect;

  return [
    "polygon(evenodd,",
    // Outer rect (full viewport)
    "0 0, 100% 0, 100% 100%, 0 100%, 0 0,",
    // Inner rect (spotlight cutout)
    `${x}px ${y}px, ${x + w}px ${y}px, ${x + w}px ${y + h}px, ${x}px ${y + h}px, ${x}px ${y}px`,
    ")",
  ].join(" ");
}

export function TourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
}: TourOverlayProps) {
  const rect = useSpotlightRect(step.target || null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { refs, floatingStyles } = useFloating({
    placement: step.placement ?? "bottom",
    middleware: [offset(12), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  // Sync the virtual reference when the spotlight rect changes
  useEffect(() => {
    if (rect) {
      refs.setPositionReference({
        getBoundingClientRect: () => rect,
      });
    }
  }, [rect, refs]);

  // When centered or no rect, center the tooltip within the spotlight area
  const isCentered = step.centered && rect;
  const resolvedStyles = isCentered
    ? {
        position: "fixed" as const,
        top: rect.y + rect.height / 2,
        left: rect.x + rect.width / 2,
        transform: "translate(-50%, -50%)",
      }
    : rect
      ? floatingStyles
      : {
          position: "fixed" as const,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };

  // Keyboard: Escape to skip, block other keys from reaching the page
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onSkip();
        return;
      }

      // Block all other keys while tour is active
      e.stopPropagation();
      e.preventDefault();
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [onSkip]);

  const clipPath = buildClipPath(rect);

  return createPortal(
    <div
      ref={overlayRef}
      data-testid="tourOverlay"
      className="fixed inset-0 z-[10000]"
      style={{ pointerEvents: "auto" }}
    >
      {/* Dim layer with spotlight cutout */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{
          clipPath: clipPath === "none" ? undefined : clipPath,
          transition: "clip-path 300ms ease-in-out",
        }}
      />

      {/* Click shield — blocks clicks outside tooltip */}
      <div className="absolute inset-0" />

      {/* Tooltip — box-shadow vignette darkens the spotlight area around it
          without overlapping the card itself */}
      <TourTooltip
        step={step}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        onNext={onNext}
        onBack={onBack}
        onSkip={onSkip}
        floatingStyles={resolvedStyles}
        floatingRef={refs.setFloating}
        vignetteshadow={!!isCentered}
      />
    </div>,
    document.body,
  );
}
