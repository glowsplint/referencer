import { describe, it, expect } from "vitest";
import { EDITOR_TOUR_STEPS } from "./tour-steps";

describe("EDITOR_TOUR_STEPS", () => {
  it("when exported, then contains exactly 7 steps", () => {
    expect(EDITOR_TOUR_STEPS).toHaveLength(7);
  });

  it("when inspected, then has correct targets in order", () => {
    const targets = EDITOR_TOUR_STEPS.map((s) => s.target);
    expect(targets).toEqual([
      '[data-testid="editorContainer"]',
      '[data-testid="lockButton"]',
      '[data-testid="annotationToolGroup"]',
      '[data-testid="eraserToolButton"]',
      '[data-testid="lockButton"]',
      '[data-testid="status-bar"]',
      '[data-testid="shareDialog"]',
    ]);
  });

  it("when inspected, then no steps have the image property", () => {
    for (const step of EDITOR_TOUR_STEPS) {
      expect(step).not.toHaveProperty("image");
    }
  });

  describe("eraser step", () => {
    it("then targets eraserToolButton without onEnter or onExit", () => {
      const eraserStep = EDITOR_TOUR_STEPS[3];
      expect(eraserStep.target).toBe('[data-testid="eraserToolButton"]');
      expect(eraserStep.onEnter).toBeUndefined();
      expect(eraserStep.onExit).toBeUndefined();
    });
  });

  describe("share step", () => {
    it("then targets shareDialog with onEnter and onExit actions", () => {
      const shareStep = EDITOR_TOUR_STEPS[6];
      expect(shareStep.target).toBe('[data-testid="shareDialog"]');
      expect(shareStep.onEnter).toBe("openShareDialog");
      expect(shareStep.onExit).toBe("closeShareDialog");
    });
  });

  describe("annotate step", () => {
    it("then targets annotationToolGroup", () => {
      const annotateStep = EDITOR_TOUR_STEPS[2];
      expect(annotateStep.target).toBe('[data-testid="annotationToolGroup"]');
    });
  });
});
