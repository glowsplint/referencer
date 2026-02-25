import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTourEngine, type TourStep } from "./use-tour-engine";

const STEPS: TourStep[] = [
  { target: "#step-1", title: "Step 1", content: "Content 1" },
  { target: "#step-2", title: "Step 2", content: "Content 2" },
  { target: "#step-3", title: "Step 3", content: "Content 3" },
];

function setup(steps = STEPS, options?: Parameters<typeof useTourEngine>[1]) {
  return renderHook(() => useTourEngine(steps, options));
}

describe("useTourEngine", () => {
  it("when initialized, then starts not running with stepIndex 0", () => {
    const { result } = setup();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.currentStep).toBeNull();
  });

  it("when start() is called, then begins the tour", () => {
    // Add target elements so auto-skip doesn't fire
    const el = document.createElement("div");
    el.id = "step-1";
    document.body.appendChild(el);

    const { result } = setup();
    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.currentStep).toEqual(STEPS[0]);

    document.body.removeChild(el);
  });

  it("when next() is called, then advances to the next step", () => {
    const el1 = document.createElement("div");
    el1.id = "step-1";
    const el2 = document.createElement("div");
    el2.id = "step-2";
    document.body.append(el1, el2);

    const { result } = setup();
    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.currentStep).toEqual(STEPS[1]);

    el1.remove();
    el2.remove();
  });

  it("when back() is called, then goes back but not below 0", () => {
    const el1 = document.createElement("div");
    el1.id = "step-1";
    const el2 = document.createElement("div");
    el2.id = "step-2";
    document.body.append(el1, el2);

    const { result } = setup();
    act(() => {
      result.current.start();
    });
    // Go forward then back
    act(() => {
      result.current.next();
    });
    expect(result.current.stepIndex).toBe(1);
    act(() => {
      result.current.back();
    });
    expect(result.current.stepIndex).toBe(0);
    // Back again should stay at 0
    act(() => {
      result.current.back();
    });
    expect(result.current.stepIndex).toBe(0);

    el1.remove();
    el2.remove();
  });

  it("when next() is called on the last step, then completes tour and calls onComplete", () => {
    const el1 = document.createElement("div");
    el1.id = "step-1";
    const el2 = document.createElement("div");
    el2.id = "step-2";
    const el3 = document.createElement("div");
    el3.id = "step-3";
    document.body.append(el1, el2, el3);

    const onComplete = vi.fn();
    const { result } = setup(STEPS, { onComplete });

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.next();
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.stepIndex).toBe(2);
    // Now on last step, next should complete
    act(() => {
      result.current.next();
    });
    expect(onComplete).toHaveBeenCalledOnce();
    expect(result.current.isRunning).toBe(false);

    el1.remove();
    el2.remove();
    el3.remove();
  });

  it("when skip() is called, then stops tour and calls onSkip", () => {
    const el = document.createElement("div");
    el.id = "step-1";
    document.body.appendChild(el);

    const onSkip = vi.fn();
    const { result } = setup(STEPS, { onSkip });

    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.skip();
    });
    expect(onSkip).toHaveBeenCalledOnce();
    expect(result.current.isRunning).toBe(false);

    el.remove();
  });

  it("when stop() is called, then stops tour without callbacks", () => {
    const el = document.createElement("div");
    el.id = "step-1";
    document.body.appendChild(el);

    const onComplete = vi.fn();
    const onSkip = vi.fn();
    const { result } = setup(STEPS, { onComplete, onSkip });

    act(() => {
      result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.isRunning).toBe(false);
    expect(onComplete).not.toHaveBeenCalled();
    expect(onSkip).not.toHaveBeenCalled();

    el.remove();
  });

  it("when accessed, then returns totalSteps equal to steps length", () => {
    const { result } = setup();
    expect(result.current.totalSteps).toBe(3);
  });

  it("when not running, then currentStep is null", () => {
    const { result } = setup();
    expect(result.current.currentStep).toBeNull();
  });

  it("when a step's target is not in the DOM, then auto-skips it", () => {
    // Only add step-2 element; step-1 is missing so should auto-skip to step-2
    const el2 = document.createElement("div");
    el2.id = "step-2";
    document.body.appendChild(el2);

    const { result } = setup();
    act(() => {
      result.current.start();
    });
    // step-1 target doesn't exist, so it should auto-advance to step-2 (index 1)
    expect(result.current.stepIndex).toBe(1);

    el2.remove();
  });
});
