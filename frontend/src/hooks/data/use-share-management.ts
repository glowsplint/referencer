import { useState, useCallback, useEffect } from "react";
import { apiFetch, apiDelete, apiPatch } from "@/lib/api-client";

export interface ShareLink {
  code: string;
  access: string;
  createdAt: string;
  expiresAt: string | null;
  createdBy: string | null;
}

export interface WorkspaceMember {
  userId: string;
  role: "owner" | "editor" | "viewer";
  name: string;
  email: string;
  avatarUrl: string;
}

export function useShareManagement(workspaceId: string, enabled: boolean) {
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const [linksData, membersData] = await Promise.all([
        apiFetch<ShareLink[]>(`/api/workspaces/${workspaceId}/links`).catch(
          () => [] as ShareLink[],
        ),
        apiFetch<WorkspaceMember[]>(`/api/workspaces/${workspaceId}/members`).catch(
          () => [] as WorkspaceMember[],
        ),
      ]);
      setLinks(linksData ?? []);
      setMembers(membersData ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const revokeLink = useCallback(
    async (code: string) => {
      setLinks((prev) => prev.filter((l) => l.code !== code));
      try {
        await apiDelete(`/api/workspaces/${workspaceId}/links/${code}`);
      } catch {
        fetchData();
        throw new Error("revoke failed");
      }
    },
    [workspaceId, fetchData],
  );

  const changeMemberRole = useCallback(
    async (userId: string, role: "editor" | "viewer") => {
      setMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
      try {
        await apiPatch(`/api/workspaces/${workspaceId}/members/${userId}`, {
          role,
        });
      } catch {
        fetchData();
        throw new Error("role change failed");
      }
    },
    [workspaceId, fetchData],
  );

  const removeMember = useCallback(
    async (userId: string) => {
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      try {
        await apiDelete(`/api/workspaces/${workspaceId}/members/${userId}`);
      } catch {
        fetchData();
        throw new Error("remove failed");
      }
    },
    [workspaceId, fetchData],
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
