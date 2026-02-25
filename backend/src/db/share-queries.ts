import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCode } from "../lib/utils";

export async function createShareLink(
  supabase: SupabaseClient,
  workspaceId: string,
  access: string,
): Promise<string> {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const code = generateCode();
    const { error } = await supabase
      .from("share_link")
      .insert({ code, workspace_id: workspaceId, access });
    if (!error) return code;
    // Retry on unique constraint violation
  }
  throw new Error(`failed to generate unique share code after ${maxRetries} retries`);
}

export async function resolveShareLink(
  supabase: SupabaseClient,
  code: string,
): Promise<{ workspaceId: string; access: string } | null> {
  // TODO: Add `expires_at` column migration to share_link table
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
