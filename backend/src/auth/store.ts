import KSUID from "ksuid";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "../types";

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function upsertUser(
  supabase: SupabaseClient,
  provider: string,
  providerUserId: string,
  email: string,
  name: string,
  avatarUrl: string,
  emailVerified: boolean = false,
): Promise<string> {
  // 1. Find by (provider, provider_user_id)
  const { data: existing } = await supabase
    .from("user_provider")
    .select("user_id")
    .eq("provider", provider)
    .eq("provider_user_id", providerUserId)
    .single();

  if (existing) {
    // Update user info.
    await supabase
      .from("user")
      .update({ name, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", existing.user_id);
    return existing.user_id;
  }

  // 2. Find by email (account linking) — only if the provider verified the email.
  if (emailVerified) {
    const { data: byEmail } = await supabase
      .from("user")
      .select("id")
      .eq("email", email)
      .single();

    if (byEmail) {
      // Link new provider to existing user.
      const providerId = KSUID.randomSync().string;
      await supabase.from("user_provider").insert({
        id: providerId,
        user_id: byEmail.id,
        provider,
        provider_user_id: providerUserId,
      });
      await supabase
        .from("user")
        .update({ name, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", byEmail.id);
      return byEmail.id;
    }
  }

  // 3. Create new user via RPC (atomic).
  const userId = KSUID.randomSync().string;
  const providerId = KSUID.randomSync().string;

  const { error } = await supabase.rpc("create_user_with_provider", {
    p_user_id: userId,
    p_email: email,
    p_name: name,
    p_avatar_url: avatarUrl,
    p_provider_id: providerId,
    p_provider: provider,
    p_provider_user_id: providerUserId,
  });

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return userId;
}

export async function createSession(
  supabase: SupabaseClient,
  userId: string,
  maxAge: number,
): Promise<string> {
  // Generate 64-char hex token (32 random bytes).
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const hashedToken = await hashToken(token);
  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();
  await supabase.from("session").insert({
    id: hashedToken,
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  return token;
}

export async function getSessionUser(
  supabase: SupabaseClient,
  token: string,
): Promise<User | null> {
  const hashedToken = await hashToken(token);
  const { data: session } = await supabase
    .from("session")
    .select("user_id, expires_at")
    .eq("id", hashedToken)
    .single();

  if (!session) return null;

  // Check expiry.
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("session").delete().eq("id", hashedToken);
    return null;
  }

  const { data: user } = await supabase
    .from("user")
    .select("id, email, name, avatar_url, created_at, updated_at")
    .eq("id", session.user_id)
    .single();

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function deleteSession(supabase: SupabaseClient, token: string): Promise<void> {
  const hashedToken = await hashToken(token);
  await supabase.from("session").delete().eq("id", hashedToken);
}

export async function maybeRefreshSession(
  supabase: SupabaseClient,
  token: string,
  maxAge: number,
): Promise<void> {
  const hashedToken = await hashToken(token);
  const { data: session } = await supabase
    .from("session")
    .select("created_at")
    .eq("id", hashedToken)
    .single();

  if (!session) return;

  const createdAt = new Date(session.created_at);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (createdAt < oneDayAgo) {
    const newExpiry = new Date(Date.now() + maxAge * 1000).toISOString();
    await supabase
      .from("session")
      .update({ created_at: new Date().toISOString(), expires_at: newExpiry })
      .eq("id", hashedToken);
  }
}

export async function cleanExpiredSessions(supabase: SupabaseClient): Promise<void> {
  await supabase.from("session").delete().lt("expires_at", new Date().toISOString());
}
