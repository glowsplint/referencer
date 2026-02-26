/**
 * Structured JSON logger for Cloudflare Workers.
 *
 * Design decision: We use plain console.log with structured JSON objects
 * instead of a third-party logging library. Reasons:
 *
 * 1. Cloudflare Workers Logs automatically extracts and indexes JSON fields
 *    from console.log output, making them searchable and filterable in the
 *    dashboard without any extra setup.
 * 2. Zero dependencies — no bundle size overhead or edge-runtime compat issues.
 * 3. The Workers Logs free tier (200k events/day, 3-day retention) is sufficient
 *    for our scale.
 *
 * Each log entry includes: level, message, timestamp, requestId, and any extra
 * fields. The requestId is a UUID generated per-request and propagated through
 * all logs in that request lifecycle, acting as a trace ID.
 *
 * Tokens and secrets must NEVER be passed as extra fields.
 *
 * @see https://developers.cloudflare.com/workers/observability/logs/workers-logs/
 */

type LogLevel = "INFO" | "WARN" | "ERROR";

interface LogEntry {
  level: LogLevel;
  msg: string;
  timestamp: string;
  requestId: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, requestId: string, msg: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    msg,
    timestamp: new Date().toISOString(),
    requestId,
    ...extra,
  };

  switch (level) {
    case "ERROR":
      console.error(JSON.stringify(entry));
      break;
    case "WARN":
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

export interface Logger {
  info: (msg: string, extra?: Record<string, unknown>) => void;
  warn: (msg: string, extra?: Record<string, unknown>) => void;
  error: (msg: string, extra?: Record<string, unknown>) => void;
}

export function createLogger(requestId?: string): Logger {
  const id = requestId ?? crypto.randomUUID();
  return {
    info: (msg: string, extra?: Record<string, unknown>) => emit("INFO", id, msg, extra),
    warn: (msg: string, extra?: Record<string, unknown>) => emit("WARN", id, msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => emit("ERROR", id, msg, extra),
  };
}

/** Standalone logger without a request context (e.g. scheduled jobs). */
export const log = createLogger("no-request");
