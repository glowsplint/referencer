export interface Metrics {
  trackRequest(method: string, path: string, status: number, durationMs: number): void;
  trackAuthEvent(
    event: "login_success" | "login_failure" | "logout" | "oauth_callback",
    provider?: string,
  ): void;
  trackRateLimit(endpoint: string, method: string): void;
  trackError(endpoint: string, method: string, errorType: string, status: number): void;
}

export function createMetrics(binding?: AnalyticsEngineDataset): Metrics {
  const write = (blobs: string[], doubles: number[], index?: string) => {
    if (!binding) return;
    try {
      binding.writeDataPoint({ blobs, doubles, indexes: index ? [index] : [] });
    } catch {
      // fire-and-forget, never fail the request
    }
  };

  return {
    trackRequest(method, path, status, durationMs) {
      write([method, path, String(status)], [1, durationMs]);
    },
    trackAuthEvent(event, provider = "unknown") {
      write(["auth", event, provider], [1]);
    },
    trackRateLimit(endpoint, method) {
      write(["rate_limit", endpoint, method], [1]);
    },
    trackError(endpoint, method, errorType, status) {
      write(["error", endpoint, method, errorType, String(status)], [1]);
    },
  };
}
