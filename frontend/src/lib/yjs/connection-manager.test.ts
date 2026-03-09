// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConnectionManager } from "./connection-manager";

// Minimal mock of WebsocketProvider as an event emitter with connect/disconnect
function createMockProvider() {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    wsconnected: false,
    shouldConnect: true,
    params: { token: "initial" } as Record<string, string>,
    ws: null as WebSocket | null,
    connect: vi.fn(function (this: ReturnType<typeof createMockProvider>) {
      this.shouldConnect = true;
    }),
    disconnect: vi.fn(function (this: ReturnType<typeof createMockProvider>) {
      this.wsconnected = false;
      this.shouldConnect = false;
      this.ws = null;
    }),
    on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(cb);
    }),
    off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(cb);
    }),
    // Helper to emit events in tests
    emit(event: string, ...args: unknown[]) {
      listeners.get(event)?.forEach((cb) => cb(...args));
    },
    // Simulate a successful connection
    simulateConnect() {
      this.wsconnected = true;
      this.ws = {} as WebSocket;
      this.emit("status", { status: "connected" });
    },
    // Simulate a connection close
    simulateClose() {
      this.wsconnected = false;
      this.ws = null;
      this.emit("connection-close");
    },
  };
}

type MockProvider = ReturnType<typeof createMockProvider>;

describe("ConnectionManager", () => {
  let provider: MockProvider;
  let refreshToken: ReturnType<typeof vi.fn>;
  let onStateChange: ReturnType<typeof vi.fn>;
  let cm: ConnectionManager;
  let originalHidden: boolean;
  let originalOnLine: boolean;

  beforeEach(() => {
    vi.useFakeTimers();
    provider = createMockProvider();
    refreshToken = vi.fn().mockResolvedValue("fresh-token");
    onStateChange = vi.fn();

    // Save originals
    originalHidden = document.hidden;
    originalOnLine = navigator.onLine;

    // Default: visible + online
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  afterEach(() => {
    cm?.destroy();
    vi.useRealTimers();
    Object.defineProperty(document, "hidden", { value: originalHidden, configurable: true });
    Object.defineProperty(navigator, "onLine", { value: originalOnLine, configurable: true });
  });

  function createCM() {
    cm = new ConnectionManager(
      provider as unknown as import("y-websocket").WebsocketProvider,
      refreshToken,
      {
        onStateChange,
      },
    );
    return cm;
  }

  describe("initialization", () => {
    it("calls refreshAndConnect when online and visible", async () => {
      createCM();
      // refreshAndConnect is called, which calls refreshToken
      await vi.advanceTimersByTimeAsync(0);
      expect(refreshToken).toHaveBeenCalledOnce();
      expect(provider.connect).toHaveBeenCalledOnce();
    });

    it("sets state to offline when navigator.onLine is false", () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      createCM();
      expect(cm.state).toBe("offline");
      expect(provider.connect).not.toHaveBeenCalled();
    });

    it("does not connect when tab is hidden", async () => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      createCM();
      await vi.advanceTimersByTimeAsync(0);
      expect(provider.connect).not.toHaveBeenCalled();
    });
  });

  describe("visibility changes", () => {
    it("disconnects when tab is hidden", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      // Simulate hide
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));

      expect(provider.disconnect).toHaveBeenCalled();
    });

    it("reconnects with token refresh when tab becomes visible while online", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);
      refreshToken.mockClear();
      provider.connect.mockClear();

      // Hide then show
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));

      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));

      await vi.advanceTimersByTimeAsync(0);
      expect(refreshToken).toHaveBeenCalledOnce();
      expect(provider.connect).toHaveBeenCalled();
    });
  });

  describe("online/offline events", () => {
    it("sets state to offline and disconnects on offline event", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      window.dispatchEvent(new Event("offline"));

      expect(cm.state).toBe("offline");
      expect(provider.disconnect).toHaveBeenCalled();
    });

    it("reconnects on online event when tab is visible", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      createCM();
      await vi.advanceTimersByTimeAsync(0);
      refreshToken.mockClear();
      provider.connect.mockClear();

      Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
      window.dispatchEvent(new Event("online"));

      await vi.advanceTimersByTimeAsync(0);
      expect(refreshToken).toHaveBeenCalledOnce();
      expect(provider.connect).toHaveBeenCalled();
    });
  });

  describe("circuit breaker", () => {
    it("activates after 3 rapid reconnects within 30s", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      // Simulate 3 rapid connect/disconnect cycles
      for (let i = 0; i < 3; i++) {
        provider.simulateConnect();
        refreshToken.mockClear();
        provider.connect.mockClear();
        // Reset connectInFlight by simulating close
        provider.simulateClose();
        // Allow refreshAndConnect to complete for non-circuit-breaker disconnects
        await vi.advanceTimersByTimeAsync(0);
      }

      expect(cm.state).toBe("unstable");
      expect(provider.shouldConnect).toBe(false);
    });

    it("retries after 30s cooldown", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      // Trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        provider.simulateConnect();
        refreshToken.mockClear();
        provider.connect.mockClear();
        provider.simulateClose();
        await vi.advanceTimersByTimeAsync(0);
      }

      expect(cm.state).toBe("unstable");
      refreshToken.mockClear();
      provider.connect.mockClear();

      // Advance past cooldown
      await vi.advanceTimersByTimeAsync(30_000);

      expect(refreshToken).toHaveBeenCalled();
      expect(provider.connect).toHaveBeenCalled();
    });
  });

  describe("stability tracking", () => {
    it("clears reconnect history after 5s stable connection", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      // Connect twice (building reconnect history)
      provider.simulateConnect();
      provider.simulateClose();
      await vi.advanceTimersByTimeAsync(0);

      provider.simulateConnect();

      // After 5s, history should be cleared
      await vi.advanceTimersByTimeAsync(5_000);

      // Now disconnect and reconnect — should not trigger circuit breaker
      // because history was cleared
      refreshToken.mockClear();
      provider.connect.mockClear();
      provider.simulateClose();
      await vi.advanceTimersByTimeAsync(0);

      // Should be reconnecting, not unstable
      expect(cm.state).not.toBe("unstable");
    });
  });

  describe("shouldRefreshToken", () => {
    it("returns true when connected, visible, and online", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);
      provider.simulateConnect();

      expect(cm.shouldRefreshToken).toBe(true);
    });

    it("returns false when offline", () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      createCM();
      expect(cm.shouldRefreshToken).toBe(false);
    });

    it("returns false when tab is hidden", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);
      provider.simulateConnect();

      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      expect(cm.shouldRefreshToken).toBe(false);
    });

    it("returns false when unstable", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      // Trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        provider.simulateConnect();
        refreshToken.mockClear();
        provider.connect.mockClear();
        provider.simulateClose();
        await vi.advanceTimersByTimeAsync(0);
      }

      expect(cm.shouldRefreshToken).toBe(false);
    });
  });

  describe("forceReconnect", () => {
    it("cancels circuit breaker and reconnects immediately", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      // Trigger circuit breaker
      for (let i = 0; i < 3; i++) {
        provider.simulateConnect();
        refreshToken.mockClear();
        provider.connect.mockClear();
        provider.simulateClose();
        await vi.advanceTimersByTimeAsync(0);
      }

      expect(cm.state).toBe("unstable");
      refreshToken.mockClear();
      provider.connect.mockClear();

      cm.forceReconnect();
      await vi.advanceTimersByTimeAsync(0);

      expect(refreshToken).toHaveBeenCalled();
      expect(provider.connect).toHaveBeenCalled();
    });

    it("does nothing when already connected", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);
      provider.simulateConnect();
      refreshToken.mockClear();
      provider.connect.mockClear();

      cm.forceReconnect();
      await vi.advanceTimersByTimeAsync(0);

      expect(refreshToken).not.toHaveBeenCalled();
      expect(provider.connect).not.toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("removes all listeners and clears timers", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);
      cm.destroy();

      expect(provider.off).toHaveBeenCalledWith("status", expect.any(Function));
      expect(provider.off).toHaveBeenCalledWith("connection-close", expect.any(Function));

      // Verify no state changes after destroy
      const stateCallCount = onStateChange.mock.calls.length;
      provider.simulateConnect();
      expect(onStateChange.mock.calls.length).toBe(stateCallCount);
    });
  });

  describe("token refresh on reconnect", () => {
    it("updates provider.params.token before connecting", async () => {
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.params.token).toBe("fresh-token");
    });

    it("connects even when token refresh fails", async () => {
      refreshToken.mockResolvedValue(undefined);
      createCM();
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.connect).toHaveBeenCalled();
      expect(provider.params.token).toBe("initial");
    });
  });
});
