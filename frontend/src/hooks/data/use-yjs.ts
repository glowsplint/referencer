// React hook for managing a Yjs workspace provider.
// Creates and tears down Y.Doc + WebsocketProvider per workspace ID.
// Fetches a JWT ticket before connecting, and refreshes it proactively.
//
// KNOWN ISSUE: In production, the ws-ticket POST may fail silently when the
// __session cookie isn't sent cross-origin (SameSite=Lax blocks cross-site POST).
// When this happens, the WebSocket connects without a token and gets 401.
// The provider falls back to local-only mode (synced=true via connection-error).
import { useEffect, useRef, useState, useCallback } from "react";
import { createWorkspaceProvider, type WorkspaceProvider } from "@/lib/yjs/provider";
import { apiPost } from "@/lib/api-client";

export function useYjs(workspaceId: string) {
  const providerRef = useRef<WorkspaceProvider | null>(null);
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;

    async function fetchTicket(): Promise<string | undefined> {
      try {
        const res = await apiPost<{ ticket: string }>("/auth/ws-ticket", { room: workspaceId });
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

      const provider = createWorkspaceProvider(workspaceId, token);
      providerRef.current = provider;

      const onStatus = ({ status }: { status: string }) => {
        setConnected(status === "connected");
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
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      setConnected(false);
      setSynced(false);
    };
  }, [workspaceId]);

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
