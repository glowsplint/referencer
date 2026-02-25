import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TourOverlay } from "./TourOverlay";
import type { TourStep } from "@/hooks/ui/use-tour-engine";

// Mock floating-ui since it relies on DOM positioning
vi.mock("@floating-ui/react", () => ({
  useFloating: () => ({
    refs: {
      setFloating: vi.fn(),
      setPositionReference: vi.fn(),
    },
    floatingStyles: { position: "fixed", top: 0, left: 0 },
  }),
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
  autoUpdate: vi.fn(),
}));

// Mock useSpotlightRect to return null (no target element)
vi.mock("@/hooks/ui/use-spotlight-rect", () => ({
  useSpotlightRect: () => null,
}));

const step: TourStep = {
  target: "[data-testid='some-element']",
  title: "Welcome",
  content: "This is the first step of the tour.",
};

describe("TourOverlay", () => {
  describe("when rendered", () => {
    it("then shows the overlay portal with tooltip", () => {
      render(
        <TourOverlay
          step={step}
          stepIndex={0}
          totalSteps={3}
          onNext={vi.fn()}
          onBack={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(screen.getByTestId("tourOverlay")).toBeInTheDocument();
      expect(screen.getByTestId("tourTooltip")).toBeInTheDocument();
      expect(screen.getByText("Welcome")).toBeInTheDocument();
      expect(screen.getByText("This is the first step of the tour.")).toBeInTheDocument();
    });

    it("then passes step data to the tooltip", () => {
      render(
        <TourOverlay
          step={{ ...step, title: "Step Two", content: "Second content" }}
          stepIndex={1}
          totalSteps={3}
          onNext={vi.fn()}
          onBack={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(screen.getByText("Step Two")).toBeInTheDocument();
      expect(screen.getByText("Second content")).toBeInTheDocument();
    });
  });

  describe("when Escape key is pressed", () => {
    it("then calls onSkip", () => {
      const onSkip = vi.fn();
      render(
        <TourOverlay
          step={step}
          stepIndex={0}
          totalSteps={3}
          onNext={vi.fn()}
          onBack={vi.fn()}
          onSkip={onSkip}
        />,
      );

      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(event);

      expect(onSkip).toHaveBeenCalledTimes(1);
    });
  });
});
