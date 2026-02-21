import type { Database } from "bun:sqlite";
import type { User } from "../types";

export function upsertUser(
  db: Database,
  provider: string,
  providerUserId: string,
  email: string,
  name: string,
  avatarUrl: string,
): string {
  // 1. Find by (provider, provider_user_id)
  const existing = db
    .query<
      { user_id: string },
      [string, string]
    >("SELECT user_id FROM user_provider WHERE provider = ? AND provider_user_id = ?")
    .get(provider, providerUserId);

  if (existing) {
    // Update user info.
    db.run("UPDATE user SET name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?", [
      name,
      avatarUrl,
      existing.user_id,
    ]);
    return existing.user_id;
  }

  // 2. Find by email (account linking).
  const byEmail = db
    .query<{ id: string }, [string]>("SELECT id FROM user WHERE email = ?")
    .get(email);

  if (byEmail) {
    // Link new provider to existing user.
    const providerId = crypto.randomUUID();
    db.run(
      "INSERT INTO user_provider (id, user_id, provider, provider_user_id) VALUES (?, ?, ?, ?)",
      [providerId, byEmail.id, provider, providerUserId],
    );
    db.run("UPDATE user SET name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?", [
      name,
      avatarUrl,
      byEmail.id,
    ]);
    return byEmail.id;
  }

  // 3. Create new user.
  const userId = crypto.randomUUID();
  const providerId = crypto.randomUUID();

  const tx = db.transaction(() => {
    db.run("INSERT INTO user (id, email, name, avatar_url) VALUES (?, ?, ?, ?)", [
      userId,
      email,
      name,
      avatarUrl,
    ]);
    db.run(
      "INSERT INTO user_provider (id, user_id, provider, provider_user_id) VALUES (?, ?, ?, ?)",
      [providerId, userId, provider, providerUserId],
    );
  });
  tx();

  return userId;
}

export function createSession(db: Database, userId: string, maxAge: number): string {
  // Generate 64-char hex token (32 random bytes).
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();
  db.run(
    "INSERT INTO session (id, user_id, created_at, expires_at) VALUES (?, ?, datetime('now'), ?)",
    [token, userId, expiresAt],
  );
  return token;
}

export function getSessionUser(db: Database, token: string): User | null {
  const row = db
    .query<
      {
        id: string;
        email: string;
        name: string;
        avatar_url: string;
        created_at: string;
        updated_at: string;
        expires_at: string;
      },
      [string]
    >(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.created_at, u.updated_at, s.expires_at
       FROM session s
       JOIN user u ON s.user_id = u.id
       WHERE s.id = ?`,
    )
    .get(token);

  if (!row) return null;

  // Check expiry.
  if (new Date(row.expires_at) < new Date()) {
    // Expired — clean up.
    db.run("DELETE FROM session WHERE id = ?", [token]);
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function deleteSession(db: Database, token: string): void {
  db.run("DELETE FROM session WHERE id = ?", [token]);
}

export function maybeRefreshSession(db: Database, token: string, maxAge: number): void {
  const row = db
    .query<{ created_at: string }, [string]>("SELECT created_at FROM session WHERE id = ?")
    .get(token);

  if (!row) return;

  const createdAt = new Date(row.created_at);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (createdAt < oneDayAgo) {
    const newExpiry = new Date(Date.now() + maxAge * 1000).toISOString();
    db.run("UPDATE session SET created_at = datetime('now'), expires_at = ? WHERE id = ?", [
      newExpiry,
      token,
    ]);
  }
}

export function cleanExpiredSessions(db: Database): void {
  db.run("DELETE FROM session WHERE expires_at < datetime('now')");
}
