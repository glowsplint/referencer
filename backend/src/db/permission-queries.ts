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
  workspaceId: string,
  userId: string,
): Promise<PermissionRole | null> {
  const { data } = await supabase
    .from("workspace_permission")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();
  return data?.role ?? null;
}

export async function setPermission(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
  role: PermissionRole,
): Promise<void> {
  await supabase
    .from("workspace_permission")
    .upsert(
      { workspace_id: workspaceId, user_id: userId, role },
      { onConflict: "workspace_id,user_id" },
    );
}

export async function listWorkspaceMembers(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<
  Array<{ userId: string; role: PermissionRole; name: string; email: string; avatarUrl: string }>
> {
  const { data: permissions } = await supabase
    .from("workspace_permission")
    .select("user_id, role")
    .eq("workspace_id", workspaceId);
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
  workspaceId: string,
  userId: string,
): Promise<void> {
  await supabase
    .from("workspace_permission")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  // Also remove from user_workspace so it vanishes from their hub
  await supabase
    .from("user_workspace")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
}
