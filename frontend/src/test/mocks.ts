// Shared typed mock factories for tests.
// Centralizes `as unknown as Editor` casts into a single location.
import { vi } from "vitest";
import type { Editor } from "@tiptap/react";

// ---------------------------------------------------------------------------
// Mock Editor
// ---------------------------------------------------------------------------

/** Minimal subset of Editor used across test mocks */
export interface MockEditor {
  id?: string;
  isDestroyed: boolean;
  state: {
    doc: Record<string, unknown>;
    tr?: {
      setMeta: ReturnType<typeof vi.fn>;
    };
  };
  view?: {
    dispatch: ReturnType<typeof vi.fn>;
  };
  on?: ReturnType<typeof vi.fn>;
  off?: ReturnType<typeof vi.fn>;
  emit?: (event: string, ...args: unknown[]) => void;
}

/** Cast a MockEditor to the real Editor type for passing to hooks/components */
export function asEditor(mock: MockEditor): Editor {
  return mock as unknown as Editor;
}

/** Create a basic mock editor suitable for decoration/plugin tests */
export function createMockEditor(opts?: {
  isDestroyed?: boolean;
  doc?: Record<string, unknown>;
}): MockEditor {
  const mockTr = {
    setMeta: vi.fn().mockReturnThis(),
  };
  return {
    isDestroyed: opts?.isDestroyed ?? false,
    state: { doc: opts?.doc ?? {}, tr: mockTr },
    view: { dispatch: vi.fn() },
  };
}

/** Create a mock editor with event emitter support (on/off/emit) */
export function createMockEditorWithEvents(textContent = "hello world testing"): MockEditor & {
  emit: (event: string, ...args: unknown[]) => void;
} {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    isDestroyed: false,
    state: {
      doc: {
        content: { size: textContent.length + 2 },
        textBetween: (from: number, to: number) => textContent.slice(from - 1, to - 1),
      },
    },
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(handler);
    }),
    emit: (event: string, ...args: unknown[]) => {
      listeners.get(event)?.forEach((handler) => handler(...args));
    },
  };
}

// ---------------------------------------------------------------------------
// Mock WebSocket Provider
// ---------------------------------------------------------------------------

export interface MockWsProvider {
  ws: {
    readyState: number;
    send: ReturnType<typeof vi.fn>;
  };
  messageHandlers: Record<number, (...args: unknown[]) => void>;
  _sent: Uint8Array[];
}

export function createMockWsProvider(readyState = WebSocket.OPEN): MockWsProvider {
  const sent: Uint8Array[] = [];
  return {
    ws: {
      readyState,
      send: vi.fn((data: Uint8Array) => sent.push(data)),
    },
    messageHandlers: {} as Record<number, (...args: unknown[]) => void>,
    _sent: sent,
  };
}
