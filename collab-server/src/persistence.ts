import { createClient } from "@supabase/supabase-js";

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
  }
  return btoa(parts.join(""));
}

export async function loadSnapshot(
  url: string,
  key: string,
  roomName: string,
): Promise<Uint8Array | null> {
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("yjs_document")
    .select("state")
    .eq("room_name", roomName)
    .single();
  if (error || !data?.state) return null;
  // Supabase stores bytea as base64
  return base64ToUint8(data.state);
}

export async function saveSnapshot(
  url: string,
  key: string,
  roomName: string,
  state: Uint8Array,
): Promise<void> {
  const supabase = createClient(url, key);
  const encoded = uint8ToBase64(state);
  const { error } = await supabase.from("yjs_document").upsert(
    {
      room_name: roomName,
      state: encoded,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room_name" },
  );
  if (error) {
    throw new Error(`Supabase upsert failed for room ${roomName}: ${error.message}`);
  }
}
