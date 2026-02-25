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
  await supabase.from("workspace_permission").upsert(
    { workspace_id: workspaceId, user_id: userId, role },
    { onConflict: "workspace_id,user_id" },
  );
}
