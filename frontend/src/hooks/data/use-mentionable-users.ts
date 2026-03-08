import { useState, useEffect, useMemo } from "react";
import type { WebsocketProvider } from "y-websocket";
import { apiFetch } from "@/lib/api-client";

interface MentionableUser {
  id: string;
  label: string;
}

interface DocumentMember {
  userId: string;
  name: string;
  role: string;
  email: string;
  avatarUrl: string;
}

export function useMentionableUsers(
  provider: WebsocketProvider | null,
  documentId: string,
): MentionableUser[] {
  const [awarenessUsers, setAwarenessUsers] = useState<MentionableUser[]>([]);
  const [members, setMembers] = useState<MentionableUser[]>([]);

  // Listen to Yjs awareness for connected users
  useEffect(() => {
    if (!provider) return;
    const awareness = provider.awareness;

    const update = () => {
      const states = awareness.getStates();
      const users: MentionableUser[] = [];
      states.forEach((state, clientId) => {
        // Skip local user
        if (clientId === awareness.clientID) return;
        const user = state.user as { name: string; color: string } | undefined;
        if (user?.name) {
          users.push({ id: `awareness-${clientId}`, label: user.name });
        }
      });
      setAwarenessUsers(users);
    };

    awareness.on("change", update);
    update();
    return () => {
      awareness.off("change", update);
    };
  }, [provider]);

  // Fetch document members
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<DocumentMember[]>(`/api/documents/${documentId}/members`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (data) {
          setMembers(data.map((m) => ({ id: m.userId, label: m.name })));
        }
      })
      .catch(() => {
        // Ignore errors (offline, no auth, etc.)
      });
    return () => controller.abort();
  }, [documentId]);

  // Deduplicate by label (name)
  return useMemo(() => {
    const seen = new Set<string>();
    const result: MentionableUser[] = [];
    for (const user of [...members, ...awarenessUsers]) {
      const key = user.label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(user);
      }
    }
    return result;
  }, [awarenessUsers, members]);
}
