export interface CollabMetrics {
  trackSync(
    event: "sync_step1" | "sync_step2_sent" | "sync_step2_received" | "update",
    room: string,
    bytes: number,
  ): void;
  trackConnection(event: "connect" | "disconnect", room: string, concurrentCount: number): void;
  trackPersistence(
    event: "snapshot_save" | "snapshot_load",
    room: string,
    bytes: number,
    success: boolean,
  ): void;
  trackError(context: string, room: string, errorType: string): void;
}

export function createCollabMetrics(binding?: AnalyticsEngineDataset): CollabMetrics {
  const write = (blobs: string[], doubles: number[], index?: string) => {
    if (!binding) return;
    try {
      binding.writeDataPoint({ blobs, doubles, indexes: index ? [index] : [] });
    } catch {
      // fire-and-forget, never fail the request
    }
  };

  return {
    trackSync(event, room, bytes) {
      write(["sync", event, room], [1, bytes]);
    },
    trackConnection(event, room, concurrentCount) {
      write(["connection", event, room], [1, concurrentCount]);
    },
    trackPersistence(event, room, bytes, success) {
      write(["persistence", event, room, success ? "ok" : "fail"], [1, bytes]);
    },
    trackError(context, room, errorType) {
      write(["error", context, room, errorType], [1]);
    },
  };
}
