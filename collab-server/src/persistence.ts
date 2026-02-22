import { createClient } from "@supabase/supabase-js";

export async function loadSnapshot(
  url: string,
  key: string,
  roomName: string
): Promise<Uint8Array | null> {
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("yjs_document")
    .select("state")
    .eq("room_name", roomName)
    .single();
  if (error || !data?.state) return null;
  // Supabase stores bytea as base64
  const binary = atob(data.state);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function saveSnapshot(
  url: string,
  key: string,
  roomName: string,
  state: Uint8Array
): Promise<void> {
  const supabase = createClient(url, key);
  // Encode as base64 for Supabase bytea column
  let binary = "";
  for (let i = 0; i < state.length; i++) {
    binary += String.fromCharCode(state[i]);
  }
  const encoded = btoa(binary);
  await supabase.from("yjs_document").upsert(
    {
      room_name: roomName,
      state: encoded,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_name" }
  );
}
