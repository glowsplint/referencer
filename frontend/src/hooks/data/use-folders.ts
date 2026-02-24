import { useState, useEffect, useCallback } from "react";
import {
  fetchFolders,
  createFolder as createApi,
  renameFolder as renameApi,
  deleteFolder as deleteApi,
  moveWorkspaceToFolder as moveApi,
  unfileWorkspace as unfileApi,
  type FolderItem,
} from "@/lib/folder-client";

export function useFolders() {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchFolders();
      setFolders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (id: string, parentId: string | null, name: string) => {
      await createApi(id, parentId, name);
      await refetch();
    },
    [refetch],
  );

  const rename = useCallback(
    async (id: string, name: string) => {
      await renameApi(id, name);
      await refetch();
    },
    [refetch],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteApi(id);
      await refetch();
    },
    [refetch],
  );

  const moveWorkspace = useCallback(
    async (folderId: string, workspaceId: string) => {
      await moveApi(folderId, workspaceId);
      await refetch();
    },
    [refetch],
  );

  const unfileWorkspace = useCallback(
    async (workspaceId: string) => {
      await unfileApi(workspaceId);
      await refetch();
    },
    [refetch],
  );

  return { folders, isLoading, error, refetch, create, rename, remove, moveWorkspace, unfileWorkspace };
}
