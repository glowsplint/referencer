import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { fetchTourPreferences, saveTourPreference } from "@/lib/tour-client";

interface TourContextValue {
  startTour: (tourId: string) => void;
  completeTour: (tourId: string) => void;
  isTourCompleted: (tourId: string) => boolean;
  isTourRunning: boolean;
  activeTourId: string | null;
}

const TourContext = createContext<TourContextValue | null>(null);

function storageKey(tourId: string): string {
  return `${STORAGE_KEYS.TOUR_STATUS}${tourId}`;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [completedTours, setCompletedTours] = useState<Set<string>>(() => {
    // Initialize from localStorage
    const set = new Set<string>();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEYS.TOUR_STATUS)) {
          const tourId = key.slice(STORAGE_KEYS.TOUR_STATUS.length);
          if (localStorage.getItem(key) === "completed") {
            set.add(tourId);
          }
        }
      }
    } catch {
      // localStorage unavailable
    }
    return set;
  });
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Fetch preferences from server for authenticated users
  useEffect(() => {
    if (!isAuthenticated || fetchedRef.current) return;
    fetchedRef.current = true;

    fetchTourPreferences()
      .then((prefs) => {
        setCompletedTours((prev) => {
          const next = new Set(prev);
          for (const [key, value] of Object.entries(prefs)) {
            if (key.startsWith("tour_completed_") && value === "true") {
              const tourId = key.slice("tour_completed_".length);
              next.add(tourId);
              // Cache to localStorage
              try {
                localStorage.setItem(storageKey(tourId), "completed");
              } catch {
                // ignore
              }
            }
          }
          return next;
        });
      })
      .catch(() => {
        // Silently fail — localStorage state is sufficient
      });
  }, [isAuthenticated]);

  const isTourCompleted = useCallback(
    (tourId: string) => completedTours.has(tourId),
    [completedTours],
  );

  const completeTour = useCallback(
    (tourId: string) => {
      setCompletedTours((prev) => new Set(prev).add(tourId));
      setActiveTourId(null);

      // Save to localStorage
      try {
        localStorage.setItem(storageKey(tourId), "completed");
      } catch {
        // ignore
      }

      // Save to server if authenticated
      if (isAuthenticated) {
        saveTourPreference(`tour_completed_${tourId}`, "true").catch(() => {});
      }
    },
    [isAuthenticated],
  );

  const startTour = useCallback((tourId: string) => {
    setActiveTourId(tourId);
  }, []);

  return (
    <TourContext.Provider
      value={{
        startTour,
        completeTour,
        isTourCompleted,
        isTourRunning: activeTourId !== null,
        activeTourId,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
