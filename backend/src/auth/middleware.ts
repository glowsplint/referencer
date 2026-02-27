import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getSessionUser, maybeRefreshSession } from "./store";
import type { AuthConfig } from "./config";
import type { Env } from "../env";

export function optionalAuth(config: AuthConfig) {
  return async (c: Context<Env>, next: Next) => {
    const token = getCookie(c, "__session");
    if (token) {
      const supabase = c.get("supabase");
      const user = await getSessionUser(supabase, token);
      c.set("user", user);
      if (user) {
        // Sliding window: rotate session token and refresh cookie if >24h old.
        const newToken = await maybeRefreshSession(supabase, token, config.sessionMaxAge);
        if (newToken) {
          setCookie(c, "__session", newToken, {
            httpOnly: true,
            secure: true,
            sameSite: "Lax",
            path: "/",
            maxAge: config.sessionMaxAge,
          });
        }
      }
    } else {
      c.set("user", null);
    }
    await next();
  };
}
