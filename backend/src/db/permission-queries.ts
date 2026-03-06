import type { SupabaseClient } from "@supabase/supabase-js";

export type PermissionRole = "owner" | "editor" | "viewer";

const ROLE_HIERARCHY: Record<PermissionRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export function hasMinimumRole(userRole: PermissionRole, requiredRole: PermissionRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export async function getPermission(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
): Promise<PermissionRole | null> {
  const { data } = await supabase
    .from("document_permission")
    .select("role")
    .eq("document_id", documentId)
    .eq("user_id", userId)
    .single();
  return data?.role ?? null;
}

export async function setPermission(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
  role: PermissionRole,
): Promise<void> {
  await supabase
    .from("document_permission")
    .upsert(
      { document_id: documentId, user_id: userId, role },
      { onConflict: "document_id,user_id" },
    );
}

export async function listDocumentMembers(
  supabase: SupabaseClient,
  documentId: string,
): Promise<
  Array<{ userId: string; role: PermissionRole; name: string; email: string; avatarUrl: string }>
> {
  const { data: permissions } = await supabase
    .from("document_permission")
    .select("user_id, role")
    .eq("document_id", documentId);
  if (!permissions || permissions.length === 0) return [];

  const userIds = permissions.map((p: any) => p.user_id);
  const { data: users } = await supabase
    .from("user")
    .select("id, name, email, avatar_url")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u: any) => [u.id, u]));
  return permissions.map((p: any) => {
    const user = userMap.get(p.user_id);
    return {
      userId: p.user_id,
      role: p.role as PermissionRole,
      name: user?.name ?? "",
      email: user?.email ?? "",
      avatarUrl: user?.avatar_url ?? "",
    };
  });
}

export async function removePermission(
  supabase: SupabaseClient,
  documentId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("document_permission")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);
  // Also remove from user_document so it vanishes from their hub
  await supabase.from("user_document").delete().eq("document_id", documentId).eq("user_id", userId);
}
