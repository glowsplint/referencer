// Orchestrates the editor guided tour: manages lifecycle, renders the overlay,
// and auto-starts for first-time users.
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTourEngine } from "@/hooks/ui/use-tour-engine";
import { useTour } from "@/contexts/TourContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useIsBreakpoint } from "@/hooks/ui/use-is-breakpoint";
import { EDITOR_TOUR_STEPS } from "./tour-steps";
import { TourOverlay } from "./TourOverlay";
import type { TourStep } from "@/hooks/ui/use-tour-engine";

export function EditorTour() {
  const { t } = useTranslation("tour");
  const { activeTourId, completeTour, isTourCompleted, startTour } = useTour();
  const { readOnly } = useWorkspace();
  const isMobile = useIsBreakpoint("max", 768);

  // Translate step titles and content (keys are dynamic strings from tour-steps.ts)
  const translatedSteps: TourStep[] = EDITOR_TOUR_STEPS.map((step) => ({
    ...step,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    title: t(step.title as any),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content: t(step.content as any),
  }));

  const isEditorTour = activeTourId === "editor";

  const engine = useTourEngine(translatedSteps, {
    onComplete: () => completeTour("editor"),
    onSkip: () => completeTour("editor"),
  });

  // Auto-start on first visit (non-mobile, non-readOnly, not completed).
  // No ref guard needed — cleanup clears the timer on re-runs, and
  // isTourCompleted prevents re-triggering after completion.
  useEffect(() => {
    if (isMobile || readOnly) return;
    if (isTourCompleted("editor")) return;
    if (activeTourId !== null) return;

    const timer = setTimeout(() => {
      startTour("editor");
    }, 500);
    return () => clearTimeout(timer);
  }, [isMobile, readOnly, isTourCompleted, startTour, activeTourId]);

  // Start/stop the engine when the active tour changes
  useEffect(() => {
    if (isEditorTour && !engine.isRunning) {
      engine.start();
    } else if (!isEditorTour && engine.isRunning) {
      engine.stop();
    }
  }, [isEditorTour, engine]);

  if (!engine.isRunning || !engine.currentStep) return null;

  return (
    <TourOverlay
      step={engine.currentStep}
      stepIndex={engine.stepIndex}
      totalSteps={engine.totalSteps}
      onNext={engine.next}
      onBack={engine.back}
      onSkip={engine.skip}
    />
  );
}
