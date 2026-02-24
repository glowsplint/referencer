import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  fetchWorkspaces,
  createWorkspace as createApi,
  renameWorkspace as renameApi,
  deleteWorkspace as deleteApi,
  duplicateWorkspace as duplicateApi,
  toggleFavorite as toggleFavoriteApi,
  type WorkspaceItem,
} from "@/lib/workspace-client";
import {
  moveWorkspaceToFolder as moveToFolderApi,
  unfileWorkspace as unfileFromFolderApi,
} from "@/lib/folder-client";

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

  /** Refetch from server without showing loading indicator (used for rollback). */
  const silentRefetch = useCallback(async () => {
    try {
      const data = await fetchWorkspaces();
      setWorkspaces(data);
      setError(null);
    } catch {
      /* If refetch also fails, keep optimistic state — user already saw the toast */
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (workspaceId: string, title?: string) => {
      await createApi(workspaceId, title);
      await refetch();
    },
    [refetch],
  );

  const rename = useCallback(
    (workspaceId: string, title: string) => {
      setWorkspaces((prev) =>
        prev.map((w) => (w.workspaceId === workspaceId ? { ...w, title } : w)),
      );
      renameApi(workspaceId, title).catch(() => {
        toast.error("Failed to rename workspace");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const remove = useCallback(
    (workspaceId: string) => {
      setWorkspaces((prev) => prev.filter((w) => w.workspaceId !== workspaceId));
      deleteApi(workspaceId).catch(() => {
        toast.error("Failed to delete workspace");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const duplicate = useCallback(
    (sourceId: string, newId: string) => {
      setWorkspaces((prev) => {
        const source = prev.find((w) => w.workspaceId === sourceId);
        if (!source) return prev;
        const now = new Date().toISOString();
        return [
          ...prev,
          {
            ...source,
            workspaceId: newId,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
          },
        ];
      });
      duplicateApi(sourceId, newId).catch(() => {
        toast.error("Failed to duplicate workspace");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const toggleFavorite = useCallback(
    (workspaceId: string, isFavorite: boolean) => {
      setWorkspaces((prev) =>
        prev.map((w) => (w.workspaceId === workspaceId ? { ...w, isFavorite } : w)),
      );
      toggleFavoriteApi(workspaceId, isFavorite).catch(() => {
        toast.error("Failed to update favorite");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const moveToFolder = useCallback(
    (workspaceId: string, folderId: string) => {
      setWorkspaces((prev) =>
        prev.map((w) => (w.workspaceId === workspaceId ? { ...w, folderId } : w)),
      );
      moveToFolderApi(folderId, workspaceId).catch(() => {
        toast.error("Failed to move workspace");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const unfileWorkspace = useCallback(
    (workspaceId: string) => {
      setWorkspaces((prev) =>
        prev.map((w) => (w.workspaceId === workspaceId ? { ...w, folderId: null } : w)),
      );
      unfileFromFolderApi(workspaceId).catch(() => {
        toast.error("Failed to remove workspace from folder");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  return {
    workspaces,
    isLoading,
    error,
    refetch,
    create,
    rename,
    remove,
    duplicate,
    toggleFavorite,
    moveToFolder,
    unfileWorkspace,
  };
}
