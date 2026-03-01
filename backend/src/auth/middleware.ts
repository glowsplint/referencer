import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { getSessionUser, maybeRefreshSession } from "./store";
import { getCookieDomain } from "./cookie-domain";
import type { AuthConfig } from "./config";
import type { Env } from "../env";

export function optionalAuth(config: AuthConfig) {
  return async (c: Context<Env>, next: Next) => {
    const token = getCookie(c, "__session");
    if (token) {
      try {
        const supabase = c.get("supabase");
        const user = await getSessionUser(supabase, token);
        c.set("user", user);
        if (user) {
          // Sliding window: rotate session token and refresh cookie if >24h old.
          try {
            const newToken = await maybeRefreshSession(supabase, token, config.sessionMaxAge);
            if (newToken) {
              const cookieDomain = getCookieDomain(c);
              setCookie(c, "__session", newToken, {
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
                path: "/",
                maxAge: config.sessionMaxAge,
                ...(cookieDomain && { domain: cookieDomain }),
              });
            }
          } catch (err) {
            // Session refresh failure is non-critical — user stays authenticated
            const log = c.get("logger");
            log.warn("Session refresh failed", { error: String(err) });
          }
        }
      } catch (err) {
        // Session lookup failed — treat as unauthenticated
        const log = c.get("logger");
        log.warn("Session lookup failed", { error: String(err) });
        c.set("user", null);
      }
    } else {
      c.set("user", null);
    }
    await next();
  };
}
