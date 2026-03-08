import type { SupabaseClient } from "@supabase/supabase-js";

const TAG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS_PER_DOC = 20;

function normalizeTag(raw: string): string {
  return raw.replace(/^#/, "").trim().toLowerCase();
}

export async function listUserTags(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("document_tag").select("tag").eq("user_id", userId);

  if (error) throw new Error(`Failed to list tags: ${error.message}`);
  if (!data) return [];

  // Return distinct tags sorted
  const tags = [...new Set(data.map((row: { tag: string }) => row.tag))];
  tags.sort();
  return tags;
}

export async function listDocumentTagsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<Record<string, string[]>> {
  const { data, error } = await supabase
    .from("document_tag")
    .select("document_id, tag")
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to list document tags: ${error.message}`);
  if (!data) return {};

  const result: Record<string, string[]> = {};
  for (const row of data) {
    const docId = row.document_id as string;
    const tag = row.tag as string;
    if (!result[docId]) result[docId] = [];
    result[docId].push(tag);
  }
  // Sort tags within each document
  for (const tags of Object.values(result)) {
    tags.sort();
  }
  return result;
}

export async function addTag(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  rawTag: string,
): Promise<void> {
  const tag = normalizeTag(rawTag);

  if (!tag || tag.length > MAX_TAG_LENGTH || !TAG_RE.test(tag)) {
    throw new Error("Invalid tag format");
  }

  // Check current tag count for this document
  const { count, error: countError } = await supabase
    .from("document_tag")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (countError) throw new Error(`Failed to count tags: ${countError.message}`);
  if ((count ?? 0) >= MAX_TAGS_PER_DOC) {
    throw new Error(`Maximum ${MAX_TAGS_PER_DOC} tags per document`);
  }

  const { error } = await supabase.from("document_tag").upsert(
    {
      user_id: userId,
      document_id: documentId,
      tag,
    },
    { onConflict: "user_id,document_id,tag" },
  );

  if (error) throw new Error(`Failed to add tag: ${error.message}`);
}

export async function removeTag(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  tag: string,
): Promise<void> {
  const { error } = await supabase
    .from("document_tag")
    .delete()
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .eq("tag", tag);

  if (error) throw new Error(`Failed to remove tag: ${error.message}`);
}

export async function copyTags(
  supabase: SupabaseClient,
  userId: string,
  sourceDocId: string,
  targetDocId: string,
): Promise<void> {
  const { data, error: readError } = await supabase
    .from("document_tag")
    .select("tag")
    .eq("user_id", userId)
    .eq("document_id", sourceDocId);

  if (readError) throw new Error(`Failed to read source tags: ${readError.message}`);
  if (!data || data.length === 0) return;

  const rows = data.map((row: { tag: string }) => ({
    user_id: userId,
    document_id: targetDocId,
    tag: row.tag,
  }));

  const { error } = await supabase.from("document_tag").insert(rows);
  if (error) throw new Error(`Failed to copy tags: ${error.message}`);
}
