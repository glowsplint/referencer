import KSUID from "ksuid";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "../types";
import { log as defaultLog } from "../lib/logger";

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
  const { data: existing, error: providerError } = await supabase
    .from("user_provider")
    .select("user_id")
    .eq("provider", provider)
    .eq("provider_user_id", providerUserId)
    .single();

  // PGRST116 = "not found" for .single() — that's expected, not an error
  if (providerError && providerError.code !== "PGRST116") {
    throw new Error(`Failed to look up provider: ${providerError.message}`);
  }

  if (existing) {
    // Update user info.
    const { error: updateError } = await supabase
      .from("user")
      .update({ name, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", existing.user_id);
    if (updateError) {
      throw new Error(`Failed to update user: ${updateError.message}`);
    }
    return existing.user_id;
  }

  // 2. Find by email (account linking) — only if the provider verified the email.
  if (emailVerified) {
    const { data: byEmail, error: emailError } = await supabase
      .from("user")
      .select("id")
      .eq("email", email)
      .single();

    if (emailError && emailError.code !== "PGRST116") {
      throw new Error(`Failed to look up user by email: ${emailError.message}`);
    }

    if (byEmail) {
      // Link new provider to existing user.
      const providerId = KSUID.randomSync().string;
      const { error: linkError } = await supabase.from("user_provider").insert({
        id: providerId,
        user_id: byEmail.id,
        provider,
        provider_user_id: providerUserId,
      });
      if (linkError) {
        throw new Error(`Failed to link provider: ${linkError.message}`);
      }
      const { error: updateError } = await supabase
        .from("user")
        .update({ name, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq("id", byEmail.id);
      if (updateError) {
        throw new Error(`Failed to update linked user: ${updateError.message}`);
      }
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
  const { error: insertError } = await supabase.from("session").insert({
    id: hashedToken,
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  });
  if (insertError) {
    throw new Error(`Failed to create session: ${insertError.message}`);
  }

  // Enforce max 10 concurrent sessions per user
  const MAX_SESSIONS = 10;
  const { data: sessions, error: listError } = await supabase
    .from("session")
    .select("id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (listError) {
    // Non-critical: session was created, just couldn't prune old ones
    return token;
  }

  if (sessions && sessions.length > MAX_SESSIONS) {
    const stale = sessions.slice(0, sessions.length - MAX_SESSIONS);
    defaultLog.info("Pruning excess sessions", { userId, pruned: stale.length });
    await supabase
      .from("session")
      .delete()
      .in(
        "id",
        stale.map((s) => s.id),
      );
  }

  return token;
}

export async function getSessionUser(
  supabase: SupabaseClient,
  token: string,
): Promise<User | null> {
  const hashedToken = await hashToken(token);
  const { data: session, error: sessionError } = await supabase
    .from("session")
    .select("user_id, expires_at")
    .eq("id", hashedToken)
    .single();

  if (sessionError || !session) return null;

  // Check expiry.
  if (new Date(session.expires_at) < new Date()) {
    defaultLog.info("Deleted expired session", { userId: session.user_id });
    await supabase.from("session").delete().eq("id", hashedToken);
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from("user")
    .select("id, email, name, avatar_url, created_at, updated_at")
    .eq("id", session.user_id)
    .single();

  if (userError || !user) return null;

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
): Promise<string | null> {
  const hashedToken = await hashToken(token);
  const { data: session, error: sessionError } = await supabase
    .from("session")
    .select("user_id, created_at")
    .eq("id", hashedToken)
    .single();

  if (sessionError || !session) return null;

  const createdAt = new Date(session.created_at);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (createdAt < oneDayAgo) {
    // Rotate: delete old session and create a new one with a fresh token
    await supabase.from("session").delete().eq("id", hashedToken);

    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const newToken = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const newHashedToken = await hashToken(newToken);
    const newExpiry = new Date(Date.now() + maxAge * 1000).toISOString();
    const { error: insertError } = await supabase.from("session").insert({
      id: newHashedToken,
      user_id: session.user_id,
      created_at: new Date().toISOString(),
      expires_at: newExpiry,
    });

    if (insertError) {
      throw new Error(`Failed to rotate session: ${insertError.message}`);
    }

    return newToken;
  }

  return null;
}

export async function revokeAllUserSessions(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  await supabase.from("session").delete().eq("user_id", userId);
}

export async function cleanExpiredSessions(supabase: SupabaseClient): Promise<void> {
  await supabase.from("session").delete().lt("expires_at", new Date().toISOString());
}
