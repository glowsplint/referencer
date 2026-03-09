// ConnectionManager wraps y-websocket's WebsocketProvider to prevent
// reconnection storms. It intercepts auto-reconnect via `shouldConnect = false`,
// disconnects on tab hide / offline, and uses a circuit breaker for unstable
// connections. All reconnection paths refresh the JWT first.

import type { WebsocketProvider } from "y-websocket";

export type ConnectionState = "connected" | "reconnecting" | "offline" | "unstable";

const CIRCUIT_BREAKER_WINDOW_MS = 30_000;
const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;
const STABILITY_MS = 5_000;

export class ConnectionManager {
  private provider: WebsocketProvider;
  private refreshToken: () => Promise<string | undefined>;
  private onStateChange?: (state: ConnectionState) => void;

  private _state: ConnectionState = "reconnecting";
  private recentReconnects: number[] = [];
  private circuitBreakerActive = false;
  private circuitBreakerTimer: ReturnType<typeof setTimeout> | undefined;
  private stabilityTimer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;
  private connectInFlight = false;

  // Bound listeners for cleanup
  private handleStatus: (evt: { status: string }) => void;
  private handleConnectionClose: () => void;
  private handleVisibilityChange: () => void;
  private handleOnline: () => void;
  private handleOffline: () => void;

  constructor(
    provider: WebsocketProvider,
    refreshToken: () => Promise<string | undefined>,
    options?: { onStateChange?: (state: ConnectionState) => void },
  ) {
    this.provider = provider;
    this.refreshToken = refreshToken;
    this.onStateChange = options?.onStateChange;

    // Bind event handlers
    this.handleStatus = (evt) => this.onStatus(evt.status);
    this.handleConnectionClose = () => this.onConnectionClose();
    this.handleVisibilityChange = () => this.onVisibilityChange();
    this.handleOnline = () => this.onOnline();
    this.handleOffline = () => this.onOffline();

    // Listen to provider events
    provider.on("status", this.handleStatus);
    provider.on("connection-close", this.handleConnectionClose);

    // Listen to browser events
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    window.addEventListener("online", this.handleOnline);
    window.addEventListener("offline", this.handleOffline);

    // Determine initial state and connect
    if (!navigator.onLine) {
      this.setState("offline");
    } else if (document.hidden) {
      // Don't connect if tab is hidden on init
      this.setState("reconnecting");
    } else {
      // Initiate first connection
      this.refreshAndConnect();
    }
  }

  get state(): ConnectionState {
    return this._state;
  }

  /** Token refresh should only happen when connected and tab is visible */
  get shouldRefreshToken(): boolean {
    return this._state === "connected" && !document.hidden && navigator.onLine;
  }

  /** Skip backoff, refresh token, connect immediately */
  forceReconnect(): void {
    if (this.destroyed) return;
    if (this._state === "connected") return;

    // Cancel any pending circuit breaker cooldown
    if (this.circuitBreakerTimer) {
      clearTimeout(this.circuitBreakerTimer);
      this.circuitBreakerTimer = undefined;
    }
    this.circuitBreakerActive = false;

    this.refreshAndConnect();
  }

  destroy(): void {
    this.destroyed = true;

    // Remove provider listeners
    this.provider.off("status", this.handleStatus);
    this.provider.off("connection-close", this.handleConnectionClose);

    // Remove browser listeners
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    window.removeEventListener("online", this.handleOnline);
    window.removeEventListener("offline", this.handleOffline);

    // Clear timers
    if (this.circuitBreakerTimer) {
      clearTimeout(this.circuitBreakerTimer);
      this.circuitBreakerTimer = undefined;
    }
    if (this.stabilityTimer) {
      clearTimeout(this.stabilityTimer);
      this.stabilityTimer = undefined;
    }
  }

  private setState(next: ConnectionState): void {
    if (next === this._state) return;
    this._state = next;
    this.onStateChange?.(next);
  }

  private deriveState(): ConnectionState {
    if (!navigator.onLine) return "offline";
    if (this.provider.wsconnected) return "connected";
    if (this.circuitBreakerActive) return "unstable";
    return "reconnecting";
  }

  private onStatus(status: string): void {
    if (this.destroyed) return;

    if (status === "connected") {
      // Track reconnection timestamp for circuit breaker
      const now = Date.now();
      this.recentReconnects.push(now);
      this.recentReconnects = this.recentReconnects.filter(
        (t) => now - t < CIRCUIT_BREAKER_WINDOW_MS,
      );

      // Start stability timer — if connection survives 5s, it's stable
      if (this.stabilityTimer) clearTimeout(this.stabilityTimer);
      this.stabilityTimer = setTimeout(() => {
        this.stabilityTimer = undefined;
        // Connection is stable, clear reconnect history
        this.recentReconnects = [];
      }, STABILITY_MS);

      this.circuitBreakerActive = false;
      this.connectInFlight = false;
      this.setState("connected");
    }
  }

  /**
   * Intercept y-websocket auto-reconnect. This handler fires synchronously
   * before y-websocket schedules setTimeout(setupWS). Setting shouldConnect
   * to false prevents that auto-reconnect.
   */
  private onConnectionClose(): void {
    if (this.destroyed) return;

    // Clear stability timer — connection didn't survive
    if (this.stabilityTimer) {
      clearTimeout(this.stabilityTimer);
      this.stabilityTimer = undefined;
    }

    // Always intercept y-websocket's auto-reconnect — we own the schedule
    this.provider.shouldConnect = false;

    // If tab is hidden or offline, just stay disconnected
    if (document.hidden || !navigator.onLine) {
      this.setState(this.deriveState());
      return;
    }

    // Check circuit breaker
    const now = Date.now();
    this.recentReconnects = this.recentReconnects.filter(
      (t) => now - t < CIRCUIT_BREAKER_WINDOW_MS,
    );

    if (this.recentReconnects.length >= CIRCUIT_BREAKER_THRESHOLD) {
      // Too many rapid reconnects — activate circuit breaker
      this.circuitBreakerActive = true;
      this.setState("unstable");

      // Schedule retry after cooldown
      if (this.circuitBreakerTimer) clearTimeout(this.circuitBreakerTimer);
      this.circuitBreakerTimer = setTimeout(() => {
        this.circuitBreakerTimer = undefined;
        if (!this.destroyed && !document.hidden && navigator.onLine) {
          this.refreshAndConnect();
        }
      }, CIRCUIT_BREAKER_COOLDOWN_MS);
    } else {
      // Normal disconnect — let ConnectionManager reconnect with token refresh
      this.setState("reconnecting");
      this.refreshAndConnect();
    }
  }

  private onVisibilityChange(): void {
    if (this.destroyed) return;

    if (document.hidden) {
      // Tab hidden — disconnect immediately
      this.provider.disconnect();
      this.connectInFlight = false;
    } else if (navigator.onLine) {
      // Tab visible again + online — reconnect
      this.refreshAndConnect();
    }
  }

  private onOnline(): void {
    if (this.destroyed) return;

    if (!document.hidden) {
      this.refreshAndConnect();
    }
    // If tab is hidden, don't reconnect — visibilitychange will handle it
  }

  private onOffline(): void {
    if (this.destroyed) return;

    this.provider.disconnect();
    this.connectInFlight = false;
    this.setState("offline");
  }

  private async refreshAndConnect(): Promise<void> {
    if (this.destroyed) return;
    // Guard against concurrent connect attempts
    if (this.connectInFlight) return;
    this.connectInFlight = true;

    this.setState(this.deriveState());

    try {
      const token = await this.refreshToken();
      if (this.destroyed) return;
      if (token) {
        (this.provider.params as Record<string, string>).token = token;
      }
    } catch {
      // Token refresh failed — connect with existing token
    }

    if (this.destroyed) return;

    // Guard: don't connect if already connected or conditions changed
    if (document.hidden || !navigator.onLine) {
      this.connectInFlight = false;
      this.setState(this.deriveState());
      return;
    }

    this.circuitBreakerActive = false;
    this.provider.connect();
    // connectInFlight is cleared in onStatus('connected') or on next close
  }
}
