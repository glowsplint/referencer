import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TourTooltip } from "./TourTooltip";
import type { TourStep } from "@/hooks/ui/use-tour-engine";

// Mock useTranslation to return keys directly so we can test without i18n setup
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
  it("renders title and content", () => {
    renderTooltip();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("shows image when provided", () => {
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

  it("hides image section when no image", () => {
    renderTooltip({
      step: {
        target: "#test",
        title: "Title",
        content: "Content",
      },
    });
    expect(document.querySelector("img")).not.toBeInTheDocument();
  });

  it("shows correct number of step dots", () => {
    const { container } = renderTooltip({ totalSteps: 4, stepIndex: 1 });
    const dots = container.querySelectorAll(".rounded-full");
    expect(dots).toHaveLength(4);
  });

  it("highlights current step dot", () => {
    const { container } = renderTooltip({ totalSteps: 3, stepIndex: 1 });
    const dots = container.querySelectorAll(".rounded-full");
    // Index 1 should have bg-primary (filled)
    expect(dots[1].className).toContain("bg-primary");
    // Other dots should not
    expect(dots[0].className).not.toContain("bg-primary");
    expect(dots[2].className).not.toContain("bg-primary");
  });

  it("hides Back button on first step", () => {
    renderTooltip({ stepIndex: 0 });
    expect(screen.queryByText("Back")).not.toBeInTheDocument();
  });

  it("shows Back button on non-first step", () => {
    renderTooltip({ stepIndex: 1 });
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("shows 'Finish' on last step instead of 'Next'", () => {
    renderTooltip({ stepIndex: 2, totalSteps: 3 });
    expect(screen.getByText("Finish")).toBeInTheDocument();
    expect(screen.queryByText("Next")).not.toBeInTheDocument();
  });

  it("shows 'Next' on non-last step", () => {
    renderTooltip({ stepIndex: 0, totalSteps: 3 });
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.queryByText("Finish")).not.toBeInTheDocument();
  });

  it("calls onNext when Next button is clicked", () => {
    const onNext = vi.fn();
    renderTooltip({ onNext, stepIndex: 0, totalSteps: 3 });
    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("calls onBack when Back button is clicked", () => {
    const onBack = vi.fn();
    renderTooltip({ onBack, stepIndex: 1 });
    fireEvent.click(screen.getByText("Back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("calls onSkip when Skip button is clicked", () => {
    const onSkip = vi.fn();
    renderTooltip({ onSkip });
    fireEvent.click(screen.getByText("Skip"));
    expect(onSkip).toHaveBeenCalledOnce();
  });

  it("calls onNext when Finish button is clicked on last step", () => {
    const onNext = vi.fn();
    renderTooltip({ onNext, stepIndex: 2, totalSteps: 3 });
    fireEvent.click(screen.getByText("Finish"));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("has data-testid tourTooltip", () => {
    renderTooltip();
    expect(screen.getByTestId("tourTooltip")).toBeInTheDocument();
  });
});
