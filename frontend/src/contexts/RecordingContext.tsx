// React context that provides recording and playback state to descendant
// components. Typed from the useRecordings and usePlayback hook return values.
import { createContext, useContext } from "react";
import type { useRecordings } from "@/hooks/recording/use-recordings";
import type { usePlayback } from "@/hooks/recording/use-playback";

export type RecordingContextValue = {
  recordings: ReturnType<typeof useRecordings>;
  playback: ReturnType<typeof usePlayback>;
};

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function RecordingProvider({
  value,
  children,
}: {
  value: RecordingContextValue;
  children: React.ReactNode;
}) {
  return <RecordingContext.Provider value={value}>{children}</RecordingContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecordingContext(): RecordingContextValue {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error("useRecordingContext must be used within RecordingProvider");
  return ctx;
}
