import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { fetchTags, addTag as addTagApi, removeTag as removeTagApi } from "@/lib/tag-client";
import { normalizeTag, isValidTag, MAX_TAGS_PER_DOC } from "@/lib/tag-utils";

export function useTags() {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [documentTags, setDocumentTags] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchTags();
      setAllTags(data.allTags);
      setDocumentTags(data.documentTags);
    } catch {
      /* keep current state on error */
    } finally {
      setIsLoading(false);
    }
  }, []);

  const silentRefetch = useCallback(async () => {
    try {
      const data = await fetchTags();
      setAllTags(data.allTags);
      setDocumentTags(data.documentTags);
    } catch {
      /* keep current state */
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addTag = useCallback(
    (documentId: string, rawTag: string) => {
      const tag = normalizeTag(rawTag);
      if (!isValidTag(tag)) return;

      const currentTags = documentTags[documentId] ?? [];
      if (currentTags.includes(tag)) return;
      if (currentTags.length >= MAX_TAGS_PER_DOC) return;

      // Optimistic update
      setDocumentTags((prev) => ({
        ...prev,
        [documentId]: [...(prev[documentId] ?? []), tag].sort(),
      }));
      setAllTags((prev) => (prev.includes(tag) ? prev : [...prev, tag].sort()));

      addTagApi(documentId, tag).catch(() => {
        toast.error("Failed to add tag");
        silentRefetch();
      });
    },
    [documentTags, silentRefetch],
  );

  const removeTag = useCallback(
    (documentId: string, tag: string) => {
      // Optimistic update
      setDocumentTags((prev) => {
        const tags = (prev[documentId] ?? []).filter((t) => t !== tag);
        const next = { ...prev };
        if (tags.length === 0) {
          delete next[documentId];
        } else {
          next[documentId] = tags;
        }
        return next;
      });

      removeTagApi(documentId, tag).catch(() => {
        toast.error("Failed to remove tag");
        silentRefetch();
      });
    },
    [silentRefetch],
  );

  return {
    allTags,
    documentTags,
    isLoading,
    addTag,
    removeTag,
  };
}
