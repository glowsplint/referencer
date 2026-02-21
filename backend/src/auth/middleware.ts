import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import type { Database } from "bun:sqlite";
import { getSessionUser, maybeRefreshSession } from "./store";
import type { AuthConfig } from "./config";
import type { User } from "../types";

declare module "hono" {
  interface ContextVariableMap {
    user: User | null;
  }
}

export function optionalAuth(db: Database, config: AuthConfig) {
  return async (c: Context, next: Next) => {
    const token = getCookie(c, "__session");
    if (token) {
      const user = getSessionUser(db, token);
      c.set("user", user);
      if (user) {
        // Sliding window: refresh session if >24h old.
        maybeRefreshSession(db, token, config.sessionMaxAge);
      }
    } else {
      c.set("user", null);
    }
    await next();
  };
}
