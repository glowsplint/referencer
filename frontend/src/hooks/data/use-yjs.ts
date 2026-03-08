// React hook for managing a Yjs document provider.
// Creates and tears down Y.Doc + WebsocketProvider per document ID.
// Fetches a JWT ticket before connecting, and refreshes it proactively.
//
// KNOWN ISSUE: In production, the ws-ticket POST may fail silently when the
// __session cookie isn't sent cross-origin (SameSite=Lax blocks cross-site POST).
// When this happens, the WebSocket connects without a token and gets 401.
// The provider falls back to local-only mode (synced=true via connection-error).
import { useEffect, useRef, useState, useCallback } from "react";
import { createDocumentProvider, type DocumentProvider } from "@/lib/yjs/provider";
import { apiPost } from "@/lib/api-client";

// Delay before showing "disconnected" in the UI. Prevents flickering on brief
// network hiccups — y-websocket reconnects aggressively (100ms backoff after a
// successful connection), so transient drops would otherwise cause rapid
// green/red cycling in the status indicator.
const DISCONNECT_GRACE_MS = 4000;

export function useYjs(documentId: string) {
  const providerRef = useRef<DocumentProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;

    async function fetchTicket(): Promise<string | undefined> {
      try {
        const res = await apiPost<{ ticket: string }>("/auth/ws-ticket", { room: documentId });
        return res.ticket;
      } catch {
        return undefined;
      }
    }

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

      const provider = createDocumentProvider(documentId, token);
      providerRef.current = provider;

      const onStatus = ({ status }: { status: string }) => {
        if (status === "connected") {
          // Connected: cancel any pending disconnect grace timer and show immediately
          if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = undefined;
          }
          setConnected(true);
        } else if (status === "disconnected") {
          // Disconnected: wait before updating UI so brief network blips don't
          // cause the indicator to flicker between green and red.
          if (!disconnectTimerRef.current) {
            disconnectTimerRef.current = setTimeout(() => {
              disconnectTimerRef.current = undefined;
              setConnected(false);
            }, DISCONNECT_GRACE_MS);
          }
        }
      };
      const onSync = (isSynced: boolean) => {
        setSynced(isSynced);
      };
      provider.wsProvider.on("status", onStatus);
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

      // Proactive token refresh every 40s (JWT lifetime is 60s)
      if (token) {
        refreshTimer = setInterval(async () => {
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
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = undefined;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      setConnected(false);
      setSynced(false);
    };
  }, [documentId]);

  const getFragment = useCallback(
    (index: number) => providerRef.current?.getFragment(index) ?? null,
    [],
  );

  return {
    provider: providerRef.current,
    wsProvider: providerRef.current?.wsProvider ?? null,
    doc: providerRef.current?.doc ?? null,
    connected,
    synced,
    getFragment,
    awareness: providerRef.current?.awareness ?? null,
  };
}
