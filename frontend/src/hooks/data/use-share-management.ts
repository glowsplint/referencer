import { useState, useCallback, useEffect } from "react";
import { apiFetch, apiDelete, apiPatch } from "@/lib/api-client";

export interface ShareLink {
  code: string;
  access: string;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string | null;
}

export interface DocumentMember {
  userId: string;
  role: "owner" | "editor" | "viewer";
  name: string;
  email: string;
  avatarUrl: string;
}

export function useShareManagement(documentId: string, enabled: boolean) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [members, setMembers] = useState<DocumentMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const [linksData, membersData] = await Promise.all([
        apiFetch<ShareLink[]>(`/api/documents/${documentId}/links`).catch(() => [] as ShareLink[]),
        apiFetch<DocumentMember[]>(`/api/documents/${documentId}/members`).catch(
          () => [] as DocumentMember[],
        ),
      ]);
      setLinks(linksData ?? []);
      setMembers(membersData ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [documentId, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revokeLink = useCallback(
    async (code: string) => {
      setLinks((prev) => prev.filter((l) => l.code !== code));
      try {
        await apiDelete(`/api/documents/${documentId}/links/${code}`);
      } catch {
        fetchData();
        throw new Error("revoke failed");
      }
    },
    [documentId, fetchData],
  );

  const changeMemberRole = useCallback(
    async (userId: string, role: "editor" | "viewer") => {
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
      try {
        await apiPatch(`/api/documents/${documentId}/members/${userId}`, {
          role,
        });
      } catch {
        fetchData();
        throw new Error("role change failed");
      }
    },
    [documentId, fetchData],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      try {
        await apiDelete(`/api/documents/${documentId}/members/${userId}`);
      } catch {
        fetchData();
        throw new Error("remove failed");
      }
    },
    [documentId, fetchData],
  );

  return {
    links,
    members,
    isLoading,
    refetch: fetchData,
    revokeLink,
    changeMemberRole,
    removeMember,
  };
}
