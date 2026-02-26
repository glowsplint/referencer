import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { EditorTour } from "./EditorTour";
import { EDITOR_TOUR_STEPS } from "./tour-steps";
import type { TourStep } from "@/hooks/ui/use-tour-engine";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// react-i18next — identity translation
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

// TourContext
const mockStartTour = vi.fn();
const mockCompleteTour = vi.fn();
const mockIsTourCompleted = vi.fn(() => false);
let mockActiveTourId: string | null = null;

vi.mock("@/contexts/TourContext", () => ({
  useTour: () => ({
    activeTourId: mockActiveTourId,
    startTour: mockStartTour,
    completeTour: mockCompleteTour,
    isTourCompleted: mockIsTourCompleted,
  }),
}));

// WorkspaceContext
let mockReadOnly = false;
let mockWorkspaceId: string | null = "test-workspace-id";

vi.mock("@/contexts/WorkspaceContext", () => ({
  useWorkspace: () => ({
    readOnly: mockReadOnly,
    workspaceId: mockWorkspaceId,
  }),
}));

// use-is-breakpoint
let mockIsMobile = false;

vi.mock("@/hooks/ui/use-is-breakpoint", () => ({
  useIsBreakpoint: () => mockIsMobile,
}));

// use-tour-engine — returns a controllable mock engine
let mockEngine = {
  isRunning: false,
  stepIndex: 0,
  currentStep: null as TourStep | null,
  totalSteps: EDITOR_TOUR_STEPS.length,
  next: vi.fn(),
  back: vi.fn(),
  skip: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

vi.mock("@/hooks/ui/use-tour-engine", () => ({
  useTourEngine: () => mockEngine,
}));

// TourOverlay — simplified mock that renders step info
vi.mock("./TourOverlay", () => ({
  TourOverlay: ({
    step,
    stepIndex,
    totalSteps,
  }: {
    step: TourStep;
    stepIndex: number;
    totalSteps: number;
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
  }) => (
    <div data-testid="tourOverlay">
      <span data-testid="tourStepTitle">{step.title}</span>
      <span data-testid="tourStepContent">{step.content}</span>
      <span data-testid="tourStepIndex">{stepIndex}</span>
      <span data-testid="tourTotalSteps">{totalSteps}</span>
    </div>
  ),
}));

// ShareDialog — simplified mock that exposes open state
vi.mock("@/components/ShareDialog", () => ({
  ShareDialog: ({
    open,
    workspaceId,
  }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    workspaceId: string;
  }) => (
    <div data-testid="shareDialog" data-open={String(open)} data-workspace-id={workspaceId} />
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SHARE_STEP_INDEX = 6; // Index of the share step in EDITOR_TOUR_STEPS

function resetMocks() {
  mockActiveTourId = null;
  mockReadOnly = false;
  mockWorkspaceId = "test-workspace-id";
  mockIsMobile = false;
  mockIsTourCompleted.mockReturnValue(false);

  mockEngine = {
    isRunning: false,
    stepIndex: 0,
    currentStep: null,
    totalSteps: EDITOR_TOUR_STEPS.length,
    next: vi.fn(),
    back: vi.fn(),
    skip: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function setEngineRunning(stepIndex: number) {
  mockEngine.isRunning = true;
  mockEngine.stepIndex = stepIndex;
  mockEngine.currentStep = EDITOR_TOUR_STEPS[stepIndex] ?? null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EditorTour", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    resetMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // Clean up any share button DOM element left over from tests
    document.querySelector('[data-testid="shareButton"]')?.remove();
  });

  describe("when tour is not active", () => {
    it("then renders nothing", () => {
      mockActiveTourId = null;
      mockEngine.isRunning = false;
      mockEngine.currentStep = null;

      const { container } = render(<EditorTour />);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when tour is active and running", () => {
    it("then renders the TourOverlay", () => {
      mockActiveTourId = "editor";
      setEngineRunning(0);

      render(<EditorTour />);
      expect(screen.getByTestId("tourOverlay")).toBeInTheDocument();
    });

    it("then passes translated step data to TourOverlay", () => {
      mockActiveTourId = "editor";
      setEngineRunning(0);

      render(<EditorTour />);
      // Since t() is an identity function, the translated title is the key itself
      expect(screen.getByTestId("tourStepTitle")).toHaveTextContent(
        EDITOR_TOUR_STEPS[0].title,
      );
      expect(screen.getByTestId("tourStepContent")).toHaveTextContent(
        EDITOR_TOUR_STEPS[0].content,
      );
    });

    it("then passes step index and total steps to TourOverlay", () => {
      mockActiveTourId = "editor";
      setEngineRunning(2);

      render(<EditorTour />);
      expect(screen.getByTestId("tourStepIndex")).toHaveTextContent("2");
      expect(screen.getByTestId("tourTotalSteps")).toHaveTextContent(
        String(EDITOR_TOUR_STEPS.length),
      );
    });
  });

  describe("when auto-starting on first visit", () => {
    it("then starts tour after 500ms delay", () => {
      mockActiveTourId = null;
      mockIsMobile = false;
      mockReadOnly = false;
      mockIsTourCompleted.mockReturnValue(false);

      render(<EditorTour />);

      expect(mockStartTour).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(mockStartTour).toHaveBeenCalledWith("editor");
    });

    it("then does not start before the 500ms delay", () => {
      mockActiveTourId = null;
      mockIsMobile = false;
      mockReadOnly = false;
      mockIsTourCompleted.mockReturnValue(false);

      render(<EditorTour />);
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(mockStartTour).not.toHaveBeenCalled();
    });
  });

  describe("when user is on mobile", () => {
    it("then does not auto-start the tour", () => {
      mockActiveTourId = null;
      mockIsMobile = true;
      mockReadOnly = false;
      mockIsTourCompleted.mockReturnValue(false);

      render(<EditorTour />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(mockStartTour).not.toHaveBeenCalled();
    });
  });

  describe("when document is read-only", () => {
    it("then does not auto-start the tour", () => {
      mockActiveTourId = null;
      mockIsMobile = false;
      mockReadOnly = true;
      mockIsTourCompleted.mockReturnValue(false);

      render(<EditorTour />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(mockStartTour).not.toHaveBeenCalled();
    });
  });

  describe("when tour was already completed", () => {
    it("then does not auto-start the tour", () => {
      mockActiveTourId = null;
      mockIsMobile = false;
      mockReadOnly = false;
      mockIsTourCompleted.mockReturnValue(true);

      render(<EditorTour />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(mockStartTour).not.toHaveBeenCalled();
    });
  });

  describe("when another tour is already active", () => {
    it("then does not auto-start the editor tour", () => {
      mockActiveTourId = "some-other-tour";
      mockIsMobile = false;
      mockReadOnly = false;
      mockIsTourCompleted.mockReturnValue(false);

      render(<EditorTour />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(mockStartTour).not.toHaveBeenCalled();
    });
  });

  describe("when stepping to the share step", () => {
    it("then opens the ShareDialog", () => {
      mockActiveTourId = "editor";
      // Start on a step before share
      setEngineRunning(5);

      const { rerender } = render(<EditorTour />);

      // Now advance to the share step
      setEngineRunning(SHARE_STEP_INDEX);
      rerender(<EditorTour />);

      const dialog = screen.getByTestId("shareDialog");
      expect(dialog).toHaveAttribute("data-open", "true");
    });

    it("then adds tour-pulse class to the share button", () => {
      // Create a share button element in the DOM
      const shareBtn = document.createElement("button");
      shareBtn.setAttribute("data-testid", "shareButton");
      document.body.appendChild(shareBtn);

      mockActiveTourId = "editor";
      setEngineRunning(5);

      const { rerender } = render(<EditorTour />);

      setEngineRunning(SHARE_STEP_INDEX);
      rerender(<EditorTour />);

      expect(shareBtn.classList.contains("tour-pulse")).toBe(true);
    });
  });

  describe("when leaving the share step", () => {
    it("then closes the ShareDialog", () => {
      mockActiveTourId = "editor";
      // Start on step before share
      setEngineRunning(5);

      const { rerender } = render(<EditorTour />);

      // Move to share step to trigger onEnter
      setEngineRunning(SHARE_STEP_INDEX);
      rerender(<EditorTour />);

      // Verify dialog is open
      expect(screen.getByTestId("shareDialog")).toHaveAttribute("data-open", "true");

      // Move back to a different step to trigger onExit
      setEngineRunning(5);
      rerender(<EditorTour />);

      expect(screen.getByTestId("shareDialog")).toHaveAttribute("data-open", "false");
    });

    it("then removes tour-pulse class from the share button", () => {
      const shareBtn = document.createElement("button");
      shareBtn.setAttribute("data-testid", "shareButton");
      document.body.appendChild(shareBtn);

      mockActiveTourId = "editor";
      setEngineRunning(5);

      const { rerender } = render(<EditorTour />);

      // Move to share step — should add pulse class
      setEngineRunning(SHARE_STEP_INDEX);
      rerender(<EditorTour />);
      expect(shareBtn.classList.contains("tour-pulse")).toBe(true);

      // Move away from share step — should remove pulse class
      setEngineRunning(5);
      rerender(<EditorTour />);
      expect(shareBtn.classList.contains("tour-pulse")).toBe(false);
    });
  });

  describe("when tour is skipped while on the share step", () => {
    it("then cleans up by closing the ShareDialog", () => {
      mockActiveTourId = "editor";
      setEngineRunning(5);

      const { rerender } = render(<EditorTour />);

      // Move to share step
      setEngineRunning(SHARE_STEP_INDEX);
      rerender(<EditorTour />);

      expect(screen.getByTestId("shareDialog")).toHaveAttribute("data-open", "true");

      // Tour stops (skip/complete) — engine goes to not running
      mockEngine.isRunning = false;
      mockEngine.currentStep = null;
      rerender(<EditorTour />);

      // Component renders nothing when not running, but the effect should
      // have fired closeShareDialog. Since we render nothing now, we can't
      // check the DOM dialog. Instead verify via the share button cleanup.
      // Re-render with running state to confirm dialog was closed.
      setEngineRunning(0);
      mockActiveTourId = "editor";
      rerender(<EditorTour />);

      expect(screen.getByTestId("shareDialog")).toHaveAttribute("data-open", "false");
    });

    it("then removes tour-pulse class from the share button", () => {
      const shareBtn = document.createElement("button");
      shareBtn.setAttribute("data-testid", "shareButton");
      document.body.appendChild(shareBtn);

      mockActiveTourId = "editor";
      setEngineRunning(5);

      const { rerender } = render(<EditorTour />);

      // Move to share step
      setEngineRunning(SHARE_STEP_INDEX);
      rerender(<EditorTour />);
      expect(shareBtn.classList.contains("tour-pulse")).toBe(true);

      // Tour stops
      mockEngine.isRunning = false;
      mockEngine.currentStep = null;
      rerender(<EditorTour />);

      expect(shareBtn.classList.contains("tour-pulse")).toBe(false);
    });
  });

  describe("when stepping to a non-action step", () => {
    it("then does not open the ShareDialog", () => {
      mockActiveTourId = "editor";
      setEngineRunning(0);

      const { rerender } = render(<EditorTour />);

      // Move to step 1 (lock button — no onEnter/onExit)
      setEngineRunning(1);
      rerender(<EditorTour />);

      const dialog = screen.getByTestId("shareDialog");
      expect(dialog).toHaveAttribute("data-open", "false");
    });
  });

  describe("when workspaceId is available", () => {
    it("then passes workspaceId to ShareDialog", () => {
      mockActiveTourId = "editor";
      mockWorkspaceId = "my-workspace-42";
      setEngineRunning(0);

      render(<EditorTour />);

      const dialog = screen.getByTestId("shareDialog");
      expect(dialog).toHaveAttribute("data-workspace-id", "my-workspace-42");
    });
  });

  describe("when workspaceId is not available", () => {
    it("then does not render ShareDialog", () => {
      mockActiveTourId = "editor";
      mockWorkspaceId = null;
      setEngineRunning(0);

      render(<EditorTour />);

      expect(screen.queryByTestId("shareDialog")).not.toBeInTheDocument();
    });
  });

  describe("when activeTourId becomes editor", () => {
    it("then calls engine.start()", () => {
      mockActiveTourId = "editor";
      mockEngine.isRunning = false;

      render(<EditorTour />);

      expect(mockEngine.start).toHaveBeenCalled();
    });
  });

  describe("when activeTourId changes away from editor while running", () => {
    it("then calls engine.stop()", () => {
      mockActiveTourId = null;
      mockEngine.isRunning = true;
      mockEngine.currentStep = EDITOR_TOUR_STEPS[0];

      render(<EditorTour />);

      expect(mockEngine.stop).toHaveBeenCalled();
    });
  });
});
