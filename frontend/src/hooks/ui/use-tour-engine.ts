// State machine hook for guided tours. Manages step progression, running state,
// and auto-skips steps whose target element is not present in the DOM.
import { useState, useCallback, useEffect, useRef } from "react";
import type { Placement } from "@floating-ui/react";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  image?: string;
  placement?: Placement;
}

interface UseTourEngineOptions {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function useTourEngine(steps: TourStep[], options?: UseTourEngineOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const next = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= stepsRef.current.length - 1) {
        optionsRef.current?.onComplete?.();
        setIsRunning(false);
        return prev;
      }
      return prev + 1;
    });
  }, []);

  const back = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const skip = useCallback(() => {
    optionsRef.current?.onSkip?.();
    setIsRunning(false);
  }, []);

  // Auto-skip steps where target element is not in the DOM.
  useEffect(() => {
    if (!isRunning) return;
    if (stepIndex >= steps.length) return;

    const step = steps[stepIndex];
    if (!step.target) return;

    const el = document.querySelector(step.target);
    if (!el) {
      // Advance to next step, or complete if this was the last one.
      if (stepIndex >= steps.length - 1) {
        optionsRef.current?.onComplete?.();
        setIsRunning(false);
      } else {
        setStepIndex((prev) => prev + 1);
      }
    }
  }, [isRunning, stepIndex, steps]);

  const currentStep = isRunning ? (steps[stepIndex] ?? null) : null;

  return {
    isRunning,
    stepIndex,
    currentStep,
    totalSteps: steps.length,
    next,
    back,
    skip,
    start,
    stop,
  };
}
