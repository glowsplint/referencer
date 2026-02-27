import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserWorkspace } from "../types";

export async function listUserWorkspaces(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserWorkspace[]> {
  const { data, error } = await supabase
    .from("user_workspace")
    .select("user_id, workspace_id, title, created_at, updated_at, is_favorite, folder_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to list workspaces: ${error.message}`);
  if (!data) return [];

  return data.map((row) => ({
    userId: row.user_id,
    workspaceId: row.workspace_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: row.is_favorite,
    folderId: row.folder_id,
  }));
}

export async function createUserWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  title: string = "",
): Promise<void> {
  // Ensure the workspace row exists
  await supabase.from("workspace").upsert({ id: workspaceId }, { onConflict: "id" });

  // Insert the user_workspace row, ignore if already exists to preserve favorites/folders
  const { error } = await supabase.from("user_workspace").upsert(
    {
      user_id: userId,
      workspace_id: workspaceId,
      title,
      updated_at: new Date().toISOString(),
      is_favorite: false,
      folder_id: null,
    },
    { onConflict: "user_id,workspace_id", ignoreDuplicates: true },
  );

  if (error) throw new Error(`Failed to create user workspace: ${error.message}`);
}

export async function getUserWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<UserWorkspace | null> {
  const { data, error } = await supabase
    .from("user_workspace")
    .select("user_id, workspace_id, title, created_at, updated_at, is_favorite, folder_id")
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    workspaceId: data.workspace_id,
    title: data.title,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    isFavorite: data.is_favorite,
    folderId: data.folder_id,
  };
}

export async function renameUserWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_workspace")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`Failed to rename workspace: ${error.message}`);
}

export async function toggleFavoriteWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  isFavorite: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("user_workspace")
    .update({ is_favorite: isFavorite })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`Failed to toggle favorite: ${error.message}`);
}

export async function touchUserWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_workspace")
    .update({ updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`Failed to touch workspace: ${error.message}`);
}

export async function deleteUserWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_workspace")
    .delete()
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`Failed to delete workspace: ${error.message}`);
}

export async function removeUserWorkspace(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_workspace")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to remove user workspace: ${error.message}`);
}

export async function duplicateWorkspace(
  supabase: SupabaseClient,
  userId: string,
  sourceWorkspaceId: string,
  newWorkspaceId: string,
): Promise<void> {
  // Read the yjs_document for the source workspace
  const { data: doc, error: readError } = await supabase
    .from("yjs_document")
    .select("state")
    .eq("room_name", sourceWorkspaceId)
    .single();

  if (readError || !doc) {
    throw new Error(`Failed to read source document: ${readError?.message ?? "not found"}`);
  }

  // Create the workspace row for the new workspace
  await supabase.from("workspace").upsert({ id: newWorkspaceId }, { onConflict: "id" });

  // Create a new yjs_document with the copied state
  const { error: writeError } = await supabase
    .from("yjs_document")
    .insert({ room_name: newWorkspaceId, state: doc.state });

  if (writeError) throw new Error(`Failed to duplicate document: ${writeError.message}`);

  // Create the user_workspace entry
  await createUserWorkspace(supabase, userId, newWorkspaceId);
}
