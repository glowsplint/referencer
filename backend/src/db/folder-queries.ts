import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceFolder } from "../types";

const MAX_FOLDER_DEPTH = 3;

export async function getFolderDepth(
  supabase: SupabaseClient,
  folderId: string,
  userId: string,
): Promise<number> {
  let depth = 0;
  let currentId: string | null = folderId;

  while (currentId && depth < MAX_FOLDER_DEPTH + 1) {
    const { data, error }: { data: { parent_id: string | null } | null; error: unknown } =
      await supabase
        .from("workspace_folder")
        .select("parent_id")
        .eq("id", currentId)
        .eq("user_id", userId)
        .single<{ parent_id: string | null }>();

    if (error || !data) break;
    depth++;
    currentId = data.parent_id;
  }

  return depth;
}

export async function listUserFolders(
  supabase: SupabaseClient,
  userId: string,
): Promise<WorkspaceFolder[]> {
  const { data, error } = await supabase
    .from("workspace_folder")
    .select("id, user_id, parent_id, name, created_at, updated_at, is_favorite")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to list folders: ${error.message}`);
  if (!data) return [];

  return data.map((row) => ({
    id: row.id,
    userId: row.user_id,
    parentId: row.parent_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: row.is_favorite,
  }));
}

export async function createFolder(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  parentId: string | null,
  name: string,
): Promise<void> {
  if (parentId) {
    const depth = await getFolderDepth(supabase, parentId, userId);
    if (depth >= MAX_FOLDER_DEPTH) {
      throw new Error(`Folder depth limit of ${MAX_FOLDER_DEPTH} exceeded`);
    }
  }

  const { error } = await supabase.from("workspace_folder").insert({
    id,
    user_id: userId,
    parent_id: parentId,
    name,
  });

  if (error) throw new Error(`Failed to create folder: ${error.message}`);
}

export async function renameFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from("workspace_folder")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to rename folder: ${error.message}`);
}

export async function deleteFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
): Promise<void> {
  const { error } = await supabase
    .from("workspace_folder")
    .delete()
    .eq("id", folderId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete folder: ${error.message}`);
}

export async function toggleFavoriteFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  isFavorite: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("workspace_folder")
    .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to toggle folder favorite: ${error.message}`);
}

export async function moveFolderToFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  newParentId: string | null,
): Promise<void> {
  if (folderId === newParentId) {
    throw new Error("Cannot move a folder into itself");
  }

  if (newParentId !== null) {
    // Check depth limit
    const parentDepth = await getFolderDepth(supabase, newParentId, userId);
    if (parentDepth >= MAX_FOLDER_DEPTH) {
      throw new Error(`Folder depth limit of ${MAX_FOLDER_DEPTH} exceeded`);
    }

    // Check for cycles: walk up from newParentId to root, ensure folderId is not an ancestor
    let currentId: string | null = newParentId;
    while (currentId) {
      if (currentId === folderId) {
        throw new Error("Cannot move a folder into one of its descendants (cycle detected)");
      }
      const { data, error }: { data: { parent_id: string | null } | null; error: unknown } =
        await supabase
          .from("workspace_folder")
          .select("parent_id")
          .eq("id", currentId)
          .eq("user_id", userId)
          .single<{ parent_id: string | null }>();
      if (error || !data) break;
      currentId = data.parent_id;
    }
  }

  const { error } = await supabase
    .from("workspace_folder")
    .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to move folder: ${error.message}`);
}

export async function moveWorkspaceToFolder(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
  folderId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_workspace")
    .update({ folder_id: folderId })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`Failed to move workspace to folder: ${error.message}`);
}

export async function unfileWorkspace(
  supabase: SupabaseClient,
  userId: string,
  workspaceId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_workspace")
    .update({ folder_id: null })
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`Failed to unfile workspace: ${error.message}`);
}
