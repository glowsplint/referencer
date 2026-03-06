import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  fetchDocuments,
  createDocument as createApi,
  renameDocument as renameApi,
  deleteDocument as deleteApi,
  duplicateDocument as duplicateApi,
  toggleFavorite as toggleFavoriteApi,
  type DocumentItem,
} from "@/lib/document-client";
import {
  moveDocumentToFolder as moveToFolderApi,
  unfileDocument as unfileFromFolderApi,
} from "@/lib/folder-client";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchDocuments();
      setDocuments(data);
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
      const data = await fetchDocuments();
      setDocuments(data);
      setError(null);
    } catch {
      /* If refetch also fails, keep optimistic state — user already saw the toast */
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const create = useCallback(
    async (documentId: string, title?: string) => {
      await createApi(documentId, title);
      await refetch();
    },
    [refetch],
  );

  const rename = useCallback(
    (documentId: string, title: string) => {
      setDocuments((prev) => prev.map((w) => (w.documentId === documentId ? { ...w, title } : w)));
      renameApi(documentId, title).catch(() => {
        toast.error("Failed to rename document");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const remove = useCallback(
    (documentId: string) => {
      setDocuments((prev) => prev.filter((w) => w.documentId !== documentId));
      deleteApi(documentId).catch(() => {
        toast.error("Failed to delete document");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const duplicate = useCallback(
    (sourceId: string, newId: string) => {
      setDocuments((prev) => {
        const source = prev.find((w) => w.documentId === sourceId);
        if (!source) return prev;
        const now = new Date().toISOString();
        return [
          ...prev,
          {
            ...source,
            documentId: newId,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
          },
        ];
      });
      duplicateApi(sourceId, newId).catch(() => {
        toast.error("Failed to duplicate document");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const toggleFavorite = useCallback(
    (documentId: string, isFavorite: boolean) => {
      setDocuments((prev) =>
        prev.map((w) => (w.documentId === documentId ? { ...w, isFavorite } : w)),
      );
      toggleFavoriteApi(documentId, isFavorite).catch(() => {
        toast.error("Failed to update favorite");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const moveToFolder = useCallback(
    (documentId: string, folderId: string) => {
      setDocuments((prev) =>
        prev.map((w) => (w.documentId === documentId ? { ...w, folderId } : w)),
      );
      moveToFolderApi(folderId, documentId).catch(() => {
        toast.error("Failed to move document");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  const unfileDocument = useCallback(
    (documentId: string) => {
      setDocuments((prev) =>
        prev.map((w) => (w.documentId === documentId ? { ...w, folderId: null } : w)),
      );
      unfileFromFolderApi(documentId).catch(() => {
        toast.error("Failed to remove document from folder");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  return {
    documents,
    isLoading,
    error,
    refetch,
    create,
    rename,
    remove,
    duplicate,
    toggleFavorite,
    moveToFolder,
    unfileDocument,
  };
}
