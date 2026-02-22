import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createWorkspace, touchWorkspace } from "@/lib/workspace-client";

export function useWorkspaceAutosave(workspaceId: string) {
  const { isAuthenticated } = useAuth();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registeredRef.current) return;
    registeredRef.current = true;
    createWorkspace(workspaceId).catch(() => {});
  }, [isAuthenticated, workspaceId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      touchWorkspace(workspaceId).catch(() => {});
    }, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, workspaceId]);
}
