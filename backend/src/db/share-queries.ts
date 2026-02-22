import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCode } from "../lib/utils";

export async function createShareLink(
  supabase: SupabaseClient,
  workspaceId: string,
  access: string,
): Promise<string> {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const code = generateCode(6);
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
  const { data } = await supabase
    .from("share_link")
    .select("workspace_id, access")
    .eq("code", code)
    .single();
  if (!data) return null;
  return { workspaceId: data.workspace_id, access: data.access };
}
