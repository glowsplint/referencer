import { useState, useEffect, useCallback } from "react";
import {
  fetchWorkspaces,
  createWorkspace as createApi,
  renameWorkspace as renameApi,
  deleteWorkspace as deleteApi,
  duplicateWorkspace as duplicateApi,
  type WorkspaceItem,
} from "@/lib/workspace-client";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchWorkspaces();
      setWorkspaces(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const create = useCallback(async (workspaceId: string, title?: string) => {
    await createApi(workspaceId, title);
    await refetch();
  }, [refetch]);

  const rename = useCallback(async (workspaceId: string, title: string) => {
    await renameApi(workspaceId, title);
    await refetch();
  }, [refetch]);

  const remove = useCallback(async (workspaceId: string) => {
    await deleteApi(workspaceId);
    await refetch();
  }, [refetch]);

  const duplicate = useCallback(async (sourceId: string, newId: string) => {
    await duplicateApi(sourceId, newId);
    await refetch();
  }, [refetch]);

  return { workspaces, isLoading, error, refetch, create, rename, remove, duplicate };
}
