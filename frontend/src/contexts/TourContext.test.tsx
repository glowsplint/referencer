import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TourProvider, useTour } from "./TourContext";
import { AuthProvider } from "./AuthContext";
import { STORAGE_KEYS } from "@/constants/storage-keys";

vi.mock("@/lib/auth-client", () => ({
  fetchAuthStatus: vi.fn().mockResolvedValue({ authenticated: false }),
  loginWith: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/lib/tour-client", () => ({
  fetchTourPreferences: vi.fn().mockResolvedValue({}),
  saveTourPreference: vi.fn().mockResolvedValue(undefined),
}));

function TourConsumer() {
  const { isTourCompleted, isTourRunning, activeTourId, startTour, completeTour } = useTour();
  return (
    <div>
      <div data-testid="isCompleted">{String(isTourCompleted("editor"))}</div>
      <div data-testid="isRunning">{String(isTourRunning)}</div>
      <div data-testid="activeTourId">{activeTourId ?? "null"}</div>
      <button data-testid="start" onClick={() => startTour("editor")}>Start</button>
      <button data-testid="complete" onClick={() => completeTour("editor")}>Complete</button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <AuthProvider>
      <TourProvider>
        <TourConsumer />
      </TourProvider>
    </AuthProvider>,
  );
}

describe("TourContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("starts with tour not completed (fresh localStorage)", async () => {
    renderWithProviders();
    expect(screen.getByTestId("isCompleted")).toHaveTextContent("false");
  });

  it("detects completed tour from localStorage", async () => {
    localStorage.setItem(`${STORAGE_KEYS.TOUR_STATUS}editor`, "completed");
    renderWithProviders();
    expect(screen.getByTestId("isCompleted")).toHaveTextContent("true");
  });

  it("completeTour saves to localStorage", async () => {
    renderWithProviders();
    expect(screen.getByTestId("isCompleted")).toHaveTextContent("false");

    act(() => {
      screen.getByTestId("complete").click();
    });

    expect(screen.getByTestId("isCompleted")).toHaveTextContent("true");
    expect(localStorage.getItem(`${STORAGE_KEYS.TOUR_STATUS}editor`)).toBe("completed");
  });

  it("startTour triggers tour running state", async () => {
    renderWithProviders();
    expect(screen.getByTestId("isRunning")).toHaveTextContent("false");
    expect(screen.getByTestId("activeTourId")).toHaveTextContent("null");

    act(() => {
      screen.getByTestId("start").click();
    });

    expect(screen.getByTestId("isRunning")).toHaveTextContent("true");
    expect(screen.getByTestId("activeTourId")).toHaveTextContent("editor");
  });

  it("completeTour clears active tour", async () => {
    renderWithProviders();

    act(() => {
      screen.getByTestId("start").click();
    });
    expect(screen.getByTestId("activeTourId")).toHaveTextContent("editor");

    act(() => {
      screen.getByTestId("complete").click();
    });
    expect(screen.getByTestId("activeTourId")).toHaveTextContent("null");
    expect(screen.getByTestId("isRunning")).toHaveTextContent("false");
  });

  it("isTourCompleted returns correct boolean", async () => {
    renderWithProviders();
    expect(screen.getByTestId("isCompleted")).toHaveTextContent("false");

    act(() => {
      screen.getByTestId("complete").click();
    });
    expect(screen.getByTestId("isCompleted")).toHaveTextContent("true");
  });

  it("throws when useTour is used outside TourProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      render(
        <AuthProvider>
          <TourConsumer />
        </AuthProvider>,
      ),
    ).toThrow("useTour must be used within TourProvider");
    consoleError.mockRestore();
  });
});
