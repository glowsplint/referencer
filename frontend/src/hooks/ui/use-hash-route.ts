import { useState, useEffect, useCallback } from "react";

export type Route =
  | { type: "hub" }
  | { type: "editor"; workspaceId: string }
  | { type: "share"; code: string };

const WORKSPACE_ID_RE =
  /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-zA-Z]{27})$/i;

const SHARE_RE = /^share\/(.+)$/;

function parseHash(): Route {
  const hash = window.location.hash;
  const hashPath = hash.replace(/^#\/?/, "").split("?")[0];
  if (!hashPath) return { type: "hub" };

  const shareMatch = SHARE_RE.exec(hashPath);
  if (shareMatch) {
    return { type: "share", code: shareMatch[1] };
  }

  if (!WORKSPACE_ID_RE.test(hashPath)) {
    // Non-matching path, redirect to hub
    window.location.hash = "#/";
    return { type: "hub" };
  }
  return { type: "editor", workspaceId: hashPath };
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = useCallback((hash: string) => {
    window.location.hash = hash;
  }, []);

  return { route, navigate };
}
