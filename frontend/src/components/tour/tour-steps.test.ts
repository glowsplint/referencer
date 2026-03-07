import { describe, it, expect } from "vitest";
import { EDITOR_TOUR_STEPS } from "./tour-steps";

describe("EDITOR_TOUR_STEPS", () => {
  it("when exported, then contains exactly 6 steps", () => {
    expect(EDITOR_TOUR_STEPS).toHaveLength(6);
  });

  it("when inspected, then has correct targets in order", () => {
    const targets = EDITOR_TOUR_STEPS.map((s) => s.target);
    expect(targets).toEqual([
      '[data-testid="editorContainer"]',
      '[data-testid="lockButton"]',
      '[data-testid="annotationToolGroup"]',
      '[data-testid="managementPane"]',
      '[data-testid="status-bar"]',
      '[data-testid="shareDialog"]',
    ]);
  });

  it("when inspected, then no steps have the image property", () => {
    for (const step of EDITOR_TOUR_STEPS) {
      expect(step).not.toHaveProperty("image");
    }
  });

  describe("layers step", () => {
    it("then targets managementPane with onEnter and onExit for trash pulse", () => {
      const layersStep = EDITOR_TOUR_STEPS[3];
      expect(layersStep.target).toBe('[data-testid="managementPane"]');
      expect(layersStep.onEnter).toBe("pulseTrashBin");
      expect(layersStep.onExit).toBe("unpulseTrashBin");
    });
  });

  describe("share step", () => {
    it("then targets shareDialog with onEnter and onExit actions", () => {
      const shareStep = EDITOR_TOUR_STEPS[5];
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
