import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TourTooltip } from "./TourTooltip";
import type { TourStep } from "@/hooks/ui/use-tour-engine";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "buttons.next": "Next",
        "buttons.back": "Back",
        "buttons.skip": "Skip",
        "buttons.finish": "Finish",
      };
      return translations[key] ?? key;
    },
    i18n: { language: "en" },
  }),
}));

function renderTooltip(
  overrides: Partial<{
    step: TourStep;
    stepIndex: number;
    totalSteps: number;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
  }> = {},
) {
  const defaultStep: TourStep = {
    target: "#test",
    title: "Test Title",
    content: "Test Content",
  };

  const props = {
    step: overrides.step ?? defaultStep,
    stepIndex: overrides.stepIndex ?? 0,
    totalSteps: overrides.totalSteps ?? 3,
    onNext: overrides.onNext ?? vi.fn(),
    onBack: overrides.onBack ?? vi.fn(),
    onSkip: overrides.onSkip ?? vi.fn(),
    floatingStyles: { position: "fixed" as const, top: 0, left: 0 },
    floatingRef: vi.fn(),
  };

  return render(<TourTooltip {...props} />);
}

describe("TourTooltip", () => {
  describe("when rendered", () => {
    it("shows the step title and content", () => {
      renderTooltip();
      expect(screen.getByText("Test Title")).toBeInTheDocument();
      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("has the correct testid", () => {
      renderTooltip();
      expect(screen.getByTestId("tourTooltip")).toBeInTheDocument();
    });
  });

  describe("when the step has an image", () => {
    it("shows the image", () => {
      renderTooltip({
        step: {
          target: "#test",
          title: "Title",
          content: "Content",
          image: "/tour/test.gif",
        },
      });
      const img = document.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "/tour/test.gif");
    });
  });

  describe("when the step has no image", () => {
    it("does not render an image element", () => {
      renderTooltip({
        step: {
          target: "#test",
          title: "Title",
          content: "Content",
        },
      });
      expect(document.querySelector("img")).not.toBeInTheDocument();
    });
  });

  describe("when on the first step", () => {
    it("hides the Back button", () => {
      renderTooltip({ stepIndex: 0 });
      expect(screen.queryByText("Back")).not.toBeInTheDocument();
    });

    it("shows the Next button", () => {
      renderTooltip({ stepIndex: 0, totalSteps: 3 });
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.queryByText("Finish")).not.toBeInTheDocument();
    });
  });

  describe("when on a middle step", () => {
    it("shows the Back button", () => {
      renderTooltip({ stepIndex: 1 });
      expect(screen.getByText("Back")).toBeInTheDocument();
    });
  });

  describe("when on the last step", () => {
    it("shows Finish instead of Next", () => {
      renderTooltip({ stepIndex: 2, totalSteps: 3 });
      expect(screen.getByText("Finish")).toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });
  });

  describe("when Next button is clicked", () => {
    it("calls onNext", () => {
      const onNext = vi.fn();
      renderTooltip({ onNext, stepIndex: 0, totalSteps: 3 });
      fireEvent.click(screen.getByText("Next"));
      expect(onNext).toHaveBeenCalledOnce();
    });
  });

  describe("when Back button is clicked", () => {
    it("calls onBack", () => {
      const onBack = vi.fn();
      renderTooltip({ onBack, stepIndex: 1 });
      fireEvent.click(screen.getByText("Back"));
      expect(onBack).toHaveBeenCalledOnce();
    });
  });

  describe("when Skip button is clicked", () => {
    it("calls onSkip", () => {
      const onSkip = vi.fn();
      renderTooltip({ onSkip });
      fireEvent.click(screen.getByText("Skip"));
      expect(onSkip).toHaveBeenCalledOnce();
    });
  });

  describe("when Finish button is clicked on the last step", () => {
    it("calls onNext", () => {
      const onNext = vi.fn();
      renderTooltip({ onNext, stepIndex: 2, totalSteps: 3 });
      fireEvent.click(screen.getByText("Finish"));
      expect(onNext).toHaveBeenCalledOnce();
    });
  });
});
