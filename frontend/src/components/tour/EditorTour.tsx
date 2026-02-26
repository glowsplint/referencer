// Orchestrates the editor guided tour: manages lifecycle, renders the overlay,
// and auto-starts for first-time users. Handles step-level actions such as
// opening the share dialog and pulsing the share button.
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTourEngine } from "@/hooks/ui/use-tour-engine";
import { useTour } from "@/contexts/TourContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useIsBreakpoint } from "@/hooks/ui/use-is-breakpoint";
import { EDITOR_TOUR_STEPS } from "./tour-steps";
import { TourOverlay } from "./TourOverlay";
import { ShareDialog } from "@/components/ShareDialog";
import type { TourStep } from "@/hooks/ui/use-tour-engine";

const PULSE_CLASS = "tour-pulse";

function dispatchAction(action: string | undefined, handlers: Record<string, () => void>) {
  if (action && handlers[action]) handlers[action]();
}

export function EditorTour() {
  const { t } = useTranslation("tour");
  const { activeTourId, completeTour, isTourCompleted, startTour } = useTour();
  const { readOnly, workspaceId } = useWorkspace();
  const isMobile = useIsBreakpoint("max", 768);
  const [shareOpen, setShareOpen] = useState(false);
  const prevStepRef = useRef<number>(-1);

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

  // Action handlers for step-level onEnter/onExit
  const actionHandlers: Record<string, () => void> = {
    openShareDialog: () => {
      setShareOpen(true);
      const btn = document.querySelector<HTMLElement>('[data-testid="shareButton"]');
      btn?.classList.add(PULSE_CLASS);
    },
    closeShareDialog: () => {
      setShareOpen(false);
      const btn = document.querySelector<HTMLElement>('[data-testid="shareButton"]');
      btn?.classList.remove(PULSE_CLASS);
    },
  };

  // Fire onEnter/onExit when the active step changes
  useEffect(() => {
    if (!engine.isRunning) {
      // Tour stopped — clean up any active exit action from the last step
      if (prevStepRef.current >= 0 && prevStepRef.current < EDITOR_TOUR_STEPS.length) {
        dispatchAction(EDITOR_TOUR_STEPS[prevStepRef.current].onExit, actionHandlers);
      }
      prevStepRef.current = -1;
      return;
    }

    const prev = prevStepRef.current;
    const curr = engine.stepIndex;

    if (prev === curr) return;

    // Exit previous step
    if (prev >= 0 && prev < EDITOR_TOUR_STEPS.length) {
      dispatchAction(EDITOR_TOUR_STEPS[prev].onExit, actionHandlers);
    }

    // Enter current step
    if (curr >= 0 && curr < EDITOR_TOUR_STEPS.length) {
      dispatchAction(EDITOR_TOUR_STEPS[curr].onEnter, actionHandlers);
    }

    prevStepRef.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.isRunning, engine.stepIndex]);

  // Auto-start on first visit (non-mobile, non-readOnly, not completed).
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
    <>
      <TourOverlay
        step={engine.currentStep}
        stepIndex={engine.stepIndex}
        totalSteps={engine.totalSteps}
        onNext={engine.next}
        onBack={engine.back}
        onSkip={engine.skip}
      />
      {workspaceId && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          workspaceId={workspaceId}
        />
      )}
    </>
  );
}
