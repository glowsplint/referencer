// React hook for managing a Yjs document provider.
// Creates and tears down Y.Doc + WebsocketProvider per document ID.
// Fetches a JWT ticket before connecting, and refreshes it proactively.
// ConnectionManager handles reconnection scheduling, visibility-based
// disconnect, and circuit-breaking to prevent reconnection storms.
//
// KNOWN ISSUE: In production, the ws-ticket POST may fail silently when the
// __session cookie isn't sent cross-origin (SameSite=Lax blocks cross-site POST).
// When this happens, the WebSocket connects without a token and gets 401.
// The provider falls back to local-only mode (synced=true via connection-error).
import { useEffect, useRef, useState, useCallback } from "react";
import { createDocumentProvider, type DocumentProvider } from "@/lib/yjs/provider";
import type { ConnectionState } from "@/lib/yjs/connection-manager";
import { apiPost } from "@/lib/api-client";

export function useYjs(documentId: string) {
  const providerRef = useRef<DocumentProvider | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("reconnecting");
  const [synced, setSynced] = useState(false);

  // Stable callback for token refresh — used by ConnectionManager
  const fetchTicket = useCallback(async (): Promise<string | undefined> => {
    try {
      const res = await apiPost<{ ticket: string }>("/auth/ws-ticket", { room: documentId });
      return res.ticket;
    } catch {
      return undefined;
    }
  }, [documentId]);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;

    async function init() {
      // Wait for page load to avoid Firefox interrupting WebSocket connections
      // during the loading phase ("connection was interrupted while the page was loading")
      if (document.readyState !== "complete") {
        await new Promise<void>((resolve) =>
          window.addEventListener("load", () => resolve(), { once: true }),
        );
      }
      if (cancelled) return;

      const token = await fetchTicket();
      if (cancelled) return;

      const provider = createDocumentProvider(documentId, fetchTicket, {
        token: token ?? undefined,
        onConnectionStateChange: (state) => {
          if (!cancelled) setConnectionState(state);
        },
      });
      providerRef.current = provider;

      const onSync = (isSynced: boolean) => {
        setSynced(isSynced);
      };
      provider.wsProvider.on("sync", onSync);

      // When the WebSocket connection fails (no collab server), treat the
      // local Y.Doc as synced so content seeding can proceed immediately.
      let connectionAttempted = false;
      const onConnectionError = () => {
        if (connectionAttempted) return;
        connectionAttempted = true;
        setSynced(true);
      };
      provider.wsProvider.on("connection-error", onConnectionError);
      provider.wsProvider.on("connection-close", onConnectionError);

      // Proactive token refresh every 40s (JWT lifetime is 60s).
      // Only refreshes when ConnectionManager says it's appropriate
      // (connected + tab visible + online).
      if (token) {
        refreshTimer = setInterval(async () => {
          if (!provider.connectionManager.shouldRefreshToken) return;
          const fresh = await fetchTicket();
          if (fresh && provider.wsProvider.params) {
            (provider.wsProvider.params as Record<string, string>).token = fresh;
          }
        }, 40_000);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (refreshTimer) clearInterval(refreshTimer);
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      setConnectionState("reconnecting");
      setSynced(false);
    };
  }, [documentId, fetchTicket]);

  const getFragment = useCallback(
    (index: number) => providerRef.current?.getFragment(index) ?? null,
    [],
  );

  const connected = connectionState === "connected";

  return {
    provider: providerRef.current,
    wsProvider: providerRef.current?.wsProvider ?? null,
    doc: providerRef.current?.doc ?? null,
    connected,
    connectionState,
    synced,
    getFragment,
    awareness: providerRef.current?.awareness ?? null,
  };
}
