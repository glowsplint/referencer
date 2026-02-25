import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  fetchFolders,
  createFolder as createApi,
  renameFolder as renameApi,
  deleteFolder as deleteApi,
  toggleFolderFavorite as toggleFavoriteApi,
  moveFolderToFolder as moveFolderApi,
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

  /** Refetch from server without showing loading indicator (used for rollback). */
  const silentRefetch = useCallback(async () => {
    try {
      const data = await fetchFolders();
      setFolders(data);
      setError(null);
    } catch {
      /* If refetch also fails, keep optimistic state — user already saw the toast */
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    (id: string, parentId: string | null, name: string) => {
      const now = new Date().toISOString();
      setFolders((prev) => [...prev, { id, parentId, name, isFavorite: false, createdAt: now, updatedAt: now }]);
      createApi(id, parentId, name).catch(() => {
        toast.error("Failed to create folder");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const rename = useCallback(
    (id: string, name: string) => {
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, name, updatedAt: new Date().toISOString() } : f)),
      );
      renameApi(id, name).catch(() => {
        toast.error("Failed to rename folder");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const remove = useCallback(
    (id: string) => {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      deleteApi(id).catch(() => {
        toast.error("Failed to delete folder");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const toggleFavorite = useCallback(
    (id: string, isFavorite: boolean) => {
      setFolders((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isFavorite, updatedAt: new Date().toISOString() } : f)),
      );
      toggleFavoriteApi(id, isFavorite).catch(() => {
        toast.error("Failed to update folder favorite");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const moveFolder = useCallback(
    (folderId: string, parentId: string | null) => {
      setFolders((prev) =>
        prev.map((f) => (f.id === folderId ? { ...f, parentId, updatedAt: new Date().toISOString() } : f)),
      );
      moveFolderApi(folderId, parentId).catch(() => {
        toast.error("Failed to move folder");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  return {
    folders,
    isLoading,
    error,
    refetch,
    create,
    rename,
    remove,
    toggleFavorite,
    moveFolder,
  };
}
