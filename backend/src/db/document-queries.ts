import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserDocument } from "../types";

export async function listUserDocuments(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserDocument[]> {
  const { data, error } = await supabase
    .from("user_document")
    .select("user_id, document_id, title, created_at, updated_at, is_favorite, folder_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to list documents: ${error.message}`);
  if (!data) return [];

  return data.map((row) => ({
    userId: row.user_id,
    documentId: row.document_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: row.is_favorite,
    folderId: row.folder_id,
  }));
}

export async function createUserDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  title: string = "",
): Promise<{ isNew: boolean }> {
  // Check if the document already exists
  const { data: existing } = await supabase
    .from("document")
    .select("id")
    .eq("id", documentId)
    .single();

  const isNew = !existing;

  if (isNew) {
    // Only insert if document doesn't exist yet
    const { error: wsError } = await supabase.from("document").insert({ id: documentId });
    if (wsError) throw new Error(`Failed to create document: ${wsError.message}`);
  }

  // Insert the user_document row, ignore if already exists to preserve favorites/folders
  const { error } = await supabase.from("user_document").upsert(
    {
      user_id: userId,
      document_id: documentId,
      title,
      updated_at: new Date().toISOString(),
      is_favorite: false,
      folder_id: null,
    },
    { onConflict: "user_id,document_id", ignoreDuplicates: true },
  );

  if (error) throw new Error(`Failed to create user document: ${error.message}`);
  return { isNew };
}

export async function getUserDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<UserDocument | null> {
  const { data, error } = await supabase
    .from("user_document")
    .select("user_id, document_id, title, created_at, updated_at, is_favorite, folder_id")
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .single();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    documentId: data.document_id,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isFavorite: data.is_favorite,
    folderId: data.folder_id,
  };
}

export async function renameUserDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_document")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (error) throw new Error(`Failed to rename document: ${error.message}`);
}

export async function toggleFavoriteDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
  isFavorite: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("user_document")
    .update({ is_favorite: isFavorite })
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (error) throw new Error(`Failed to toggle favorite: ${error.message}`);
}

export async function touchUserDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_document")
    .update({ updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (error) throw new Error(`Failed to touch document: ${error.message}`);
}

export async function deleteUserDocument(
  supabase: SupabaseClient,
  userId: string,
  documentId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_document")
    .delete()
    .eq("user_id", userId)
    .eq("document_id", documentId);

  if (error) throw new Error(`Failed to delete document: ${error.message}`);
}

export async function deleteDocumentCascade(
  supabase: SupabaseClient,
  documentId: string,
): Promise<void> {
  // Order matters — delete dependent rows first to avoid FK violations
  await supabase.from("share_link").delete().eq("document_id", documentId);
  await supabase.from("user_document").delete().eq("document_id", documentId);
  await supabase.from("document_permission").delete().eq("document_id", documentId);
  await supabase.from("yjs_document").delete().eq("document_id", documentId);
  await supabase.from("document").delete().eq("id", documentId);
}

export async function duplicateDocument(
  supabase: SupabaseClient,
  userId: string,
  sourceDocumentId: string,
  newDocumentId: string,
): Promise<void> {
  // Read the yjs_document for the source document
  const { data: doc, error: readError } = await supabase
    .from("yjs_document")
    .select("state")
    .eq("room_name", sourceDocumentId)
    .single();

  if (readError || !doc) {
    throw new Error(`Failed to read source document: ${readError?.message ?? "not found"}`);
  }

  // Create the document row for the new document
  await supabase.from("document").upsert({ id: newDocumentId }, { onConflict: "id" });

  // Create a new yjs_document with the copied state
  const { error: writeError } = await supabase
    .from("yjs_document")
    .insert({ room_name: newDocumentId, state: doc.state });

  if (writeError) throw new Error(`Failed to duplicate document: ${writeError.message}`);

  // Create the user_document entry
  await createUserDocument(supabase, userId, newDocumentId);
}
