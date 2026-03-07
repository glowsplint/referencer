import type { SupabaseClient } from "@supabase/supabase-js";
import { generateCode } from "../lib/utils";

export async function createShareLink(
  supabase: SupabaseClient,
  documentId: string,
  access: string,
  createdBy?: string,
  expiresAt?: string | null,
): Promise<string> {
  const maxRetries = 5;
  for (let i = 0; i < maxRetries; i++) {
    const code = generateCode();
    const expires_at =
      expiresAt === undefined
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : expiresAt;
    const { error } = await supabase.from("share_link").insert({
      code,
      document_id: documentId,
      access,
      expires_at,
      created_by: createdBy ?? null,
    });
    if (!error) return code;
    // Only retry on unique constraint violation (code collision)
    const isUniqueViolation = error.code === "23505" || error.message?.includes("duplicate");
    if (!isUniqueViolation) {
      throw new Error(`share_link insert failed: ${error.code} ${error.message}`);
    }
  }
  throw new Error(`failed to generate unique share code after ${maxRetries} retries`);
}

export async function listShareLinks(
  supabase: SupabaseClient,
  documentId: string,
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
    .eq("document_id", documentId);
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
  documentId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("share_link")
    .delete()
    .eq("code", code)
    .eq("document_id", documentId)
    .select("code");
  return Array.isArray(data) && data.length > 0;
}

export async function resolveShareLink(
  supabase: SupabaseClient,
  code: string,
): Promise<{ documentId: string; access: string } | null> {
  const { data } = await supabase
    .from("share_link")
    .select("document_id, access, expires_at")
    .eq("code", code)
    .single();
  if (!data) return null;

  // Check expiry if the column exists and has a value
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return { documentId: data.document_id, access: data.access };
}
