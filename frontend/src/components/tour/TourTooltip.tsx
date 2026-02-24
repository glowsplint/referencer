// Tooltip card rendered inside the tour overlay. Shows an optional image,
// title, description, step dots, and navigation buttons.
import type { CSSProperties, RefCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TourStep } from "@/hooks/ui/use-tour-engine";

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  floatingStyles: CSSProperties;
  floatingRef: RefCallback<HTMLElement>;
}

export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  floatingStyles,
  floatingRef,
}: TourTooltipProps) {
  const { t } = useTranslation("tour");
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div
      ref={floatingRef}
      style={floatingStyles}
      data-testid="tourTooltip"
      className="w-[90vw] sm:w-[520px] bg-popover text-popover-foreground rounded-xl shadow-xl border border-border overflow-hidden"
    >
      {step.image && (
        <img
          src={step.image}
          alt=""
          className="w-full max-h-[300px] object-cover bg-muted"
        />
      )}

      <div className="p-5">
        <h3 className="font-semibold text-lg leading-tight">{step.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          {step.content}
        </p>

        <div className="mt-4 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => (
              <span
                key={i}
                className={`inline-block size-2 rounded-full ${
                  i === stepIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSkip}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {t("buttons.skip")}
            </button>

            {!isFirst && (
              <button
                type="button"
                onClick={onBack}
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background hover:bg-accent transition-colors cursor-pointer"
              >
                {t("buttons.back")}
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              {isLast ? t("buttons.finish") : t("buttons.next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
