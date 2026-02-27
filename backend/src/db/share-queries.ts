import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCode } from "../lib/utils";

export async function createShareLink(
  supabase: SupabaseClient,
  workspaceId: string,
  access: string,
  createdBy?: string,
): Promise<string> {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const code = generateCode();
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("share_link").insert({
      code,
      workspace_id: workspaceId,
      access,
      expires_at,
      created_by: createdBy ?? null,
    });
    if (!error) return code;
    // Retry on unique constraint violation
  }
  throw new Error(`failed to generate unique share code after ${maxRetries} retries`);
}

export async function listShareLinks(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<
  Array<{
    code: string;
    access: string;
    createdAt: string;
    expiresAt: string | null;
    createdBy: string | null;
  }>
> {
  const { data } = await supabase
    .from("share_link")
    .select("code, access, created_at, expires_at, created_by")
    .eq("workspace_id", workspaceId);
  if (!data) return [];
  const now = new Date();
  return data
    .filter((row: any) => !row.expires_at || new Date(row.expires_at) > now)
    .map((row: any) => ({
      code: row.code,
      access: row.access,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      createdBy: row.created_by,
    }));
}

export async function deleteShareLink(
  supabase: SupabaseClient,
  code: string,
  workspaceId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("share_link")
    .delete()
    .eq("code", code)
    .eq("workspace_id", workspaceId)
    .select("code");
  return Array.isArray(data) && data.length > 0;
}

export async function resolveShareLink(
  supabase: SupabaseClient,
  code: string,
): Promise<{ workspaceId: string; access: string } | null> {
  const { data } = await supabase
    .from("share_link")
    .select("workspace_id, access, expires_at")
    .eq("code", code)
    .single();
  if (!data) return null;

  // Check expiry if the column exists and has a value
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return { workspaceId: data.workspace_id, access: data.access };
}
