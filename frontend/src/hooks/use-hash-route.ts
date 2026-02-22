import { useState, useEffect, useCallback } from "react";

export type Route =
  | { type: "hub" }
  | { type: "editor"; workspaceId: string; readOnly: boolean };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseHash(): Route {
  const hash = window.location.hash;
  const hashPath = hash.replace(/^#\/?/, "").split("?")[0];
  if (!hashPath) return { type: "hub" };
  if (!UUID_RE.test(hashPath)) {
    // Non-UUID path, redirect to hub
    window.location.hash = "#/";
    return { type: "hub" };
  }
  const qs = hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
  const readOnly = new URLSearchParams(qs).get("access") === "readonly";
  return { type: "editor", workspaceId: hashPath, readOnly };
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
