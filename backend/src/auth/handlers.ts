import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateState, generateCodeVerifier, Google, GitHub } from "arctic";
import { kvRateLimiter } from "../lib/rate-limit";
import { createProviders, getProviderFromMap, type OAuthProvider } from "./providers";
import { loadAuthConfig, type AuthConfig } from "./config";
import {
  upsertUser,
  createSession,
  getSessionUser,
  deleteSession,
  revokeAllUserSessions,
} from "./store";
import { signJwt } from "../lib/jwt";
import { getCookieDomain, getPreviewOrigin, isAllowedOrigin } from "./cookie-domain";
import type { Env } from "../env";
import type { Logger } from "../lib/logger";

interface AuthState {
  state: string;
  codeVerifier?: string;
  origin?: string;
}

const getClientIp = (c: any) =>
  c.req.header("cf-connecting-ip") ??
  c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
  c.req.header("x-real-ip") ??
  "unknown";

const authStartLimiter = kvRateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: getClientIp,
});

const authCallbackLimiter = kvRateLimiter({
  windowMs: 60 * 1000,
  limit: 5,
  keyGenerator: getClientIp,
});

const authLogoutLimiter = kvRateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: getClientIp,
});

export function createAuthRoutes() {
  const auth = new Hono<Env>();

  // GET /auth/me
  auth.get("/me", async (c) => {
    const log = c.get("logger");
    const token = getCookie(c, "__session");
    if (!token) {
      return c.json({ authenticated: false });
    }

    const supabase = c.get("supabase");
    const user = await getSessionUser(supabase, token);
    if (!user) {
      deleteCookie(c, "__session", { path: "/" });
      return c.json({ authenticated: false });
    }

    log.info("GET /auth/me", { userId: user.id });
    return c.json({ authenticated: true, user });
  });

  // POST /auth/logout
  auth.post("/logout", authLogoutLimiter, async (c) => {
    const log = c.get("logger");
    const token = getCookie(c, "__session");
    if (token) {
      const supabase = c.get("supabase");
      await deleteSession(supabase, token);
    }
    deleteCookie(c, "__session", { path: "/" });
    log.info("POST /auth/logout");
    return c.json({ ok: true });
  });

  // POST /auth/logout-all — revoke all sessions for the current user
  auth.post("/logout-all", authLogoutLimiter, async (c) => {
    const log = c.get("logger");
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const supabase = c.get("supabase");
    await revokeAllUserSessions(supabase, user.id);
    deleteCookie(c, "__session", { path: "/" });
    log.info("POST /auth/logout-all", { userId: user.id });
    return c.json({ success: true });
  });

  // POST /auth/ws-ticket — issue a short-lived JWT for WebSocket auth
  const wsTicketLimiter = kvRateLimiter({
    windowMs: 60_000,
    limit: 30,
    keyGenerator: getClientIp,
  });

  auth.post("/ws-ticket", wsTicketLimiter, async (c) => {
    const log = c.get("logger");
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json<{ room?: string }>();
    if (!body.room) {
      return c.json({ error: "Missing room" }, 400);
    }

    const ticket = await signJwt(
      {
        sub: user.id,
        room: body.room,
        iss: "referencer",
        aud: "collab",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      c.env.WS_JWT_SECRET,
    );

    log.info("POST /auth/ws-ticket", { userId: user.id, room: body.room });
    return c.json({ ticket });
  });

  // GET /auth/:provider — start OAuth flow
  auth.get("/:provider", authStartLimiter, (c) => {
    const log = c.get("logger");
    const config = loadAuthConfig(c.env);
    const providerName = c.req.param("provider");
    const providers = createProviders(config);
    const provider = getProviderFromMap(providers, providerName);
    if (!provider) {
      return c.json({ error: `Unknown provider: ${providerName}` }, 404);
    }

    const state = generateState();
    const authState: AuthState = { state };
    let authUrl: URL;

    if (provider instanceof Google) {
      const codeVerifier = generateCodeVerifier();
      authState.codeVerifier = codeVerifier;
      authUrl = provider.createAuthorizationURL(state, codeVerifier, [
        "openid",
        "email",
        "profile",
      ]);
    } else {
      authUrl = (provider as GitHub).createAuthorizationURL(state, ["read:user", "user:email"]);
    }

    const previewOrigin = getPreviewOrigin(c);
    if (previewOrigin) {
      authState.origin = previewOrigin;
    }

    // Store state in cookie (10 minute expiry).
    const cookieDomain = getCookieDomain(c);
    setCookie(c, "__auth_state", JSON.stringify(authState), {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 600,
      ...(cookieDomain && { domain: cookieDomain }),
    });

    log.info("GET /auth/:provider", { provider: providerName });
    return c.redirect(authUrl.toString());
  });

  // GET /auth/:provider/callback
  auth.get("/:provider/callback", authCallbackLimiter, async (c) => {
    const config = loadAuthConfig(c.env);
    return handleCallback(c, config, c.get("logger"));
  });

  return auth;
}

async function handleCallback(c: any, config: AuthConfig, log: Logger) {
  const providerName = c.req.param("provider");
  const providers = createProviders(config);
  const provider = getProviderFromMap(providers, providerName);
  if (!provider) {
    return c.json({ error: `Unknown provider: ${providerName}` }, 404);
  }

  const frontendUrl: string = c.env.FRONTEND_URL ?? "http://localhost:5173";

  // Read state from cookie.
  const stateCookie = getCookie(c, "__auth_state");
  const cookieDomain = getCookieDomain(c);
  deleteCookie(c, "__auth_state", { path: "/", ...(cookieDomain && { domain: cookieDomain }) });

  if (!stateCookie) {
    return c.json({ error: "Missing auth state" }, 400);
  }

  let authState: AuthState;
  try {
    authState = JSON.parse(stateCookie);
  } catch {
    return c.json({ error: "Invalid auth state" }, 400);
  }

  const code = c.req.query("code");
  const returnedState = c.req.query("state");

  if (!code || !returnedState) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  if (returnedState !== authState.state) {
    return c.json({ error: "State mismatch" }, 400);
  }

  // Exchange code for tokens.
  let tokens: any;
  try {
    if (provider instanceof Google) {
      tokens = await provider.validateAuthorizationCode(code, authState.codeVerifier!);
    } else {
      tokens = await (provider as GitHub).validateAuthorizationCode(code);
    }
  } catch (err) {
    log.error("GET /auth/:provider/callback token exchange failed", { provider: providerName });
    return c.json({ error: "Token exchange failed" }, 400);
  }

  let providerUserId: string;
  let email: string;
  let name: string;
  let avatarUrl: string;
  let emailVerified = false;

  if (provider instanceof Google) {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    const profile = (await res.json()) as any;
    providerUserId = profile.sub;
    email = profile.email ?? "";
    name = profile.name ?? "";
    avatarUrl = profile.picture ?? "";
    emailVerified = profile.email_verified === true;
  } else {
    // GitHub
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        "User-Agent": "referencer",
      },
    });
    const profile = (await res.json()) as any;
    providerUserId = String(profile.id);
    name = profile.name ?? profile.login ?? "";
    avatarUrl = profile.avatar_url ?? "";
    email = profile.email ?? "";

    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
          "User-Agent": "referencer",
        },
      });
      const emails = (await emailsRes.json()) as any[];
      const primary = emails.find((e: any) => e.primary && e.verified);
      email = primary?.email ?? "";
      emailVerified = !!primary?.verified;
    }
  }

  if (!email) {
    return c.json({ error: "Could not retrieve email from provider" }, 400);
  }

  // Upsert user and create session.
  const supabase = c.get("supabase");
  const userId = await upsertUser(
    supabase,
    providerName,
    providerUserId,
    email,
    name,
    avatarUrl,
    emailVerified,
  );
  const sessionToken = await createSession(supabase, userId, config.sessionMaxAge);

  setCookie(c, "__session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: config.sessionMaxAge,
    ...(cookieDomain && { domain: cookieDomain }),
  });

  // Redirect to preview origin if valid, otherwise production frontend.
  const redirectTarget =
    authState.origin && isAllowedOrigin(authState.origin, c.env)
      ? authState.origin
      : frontendUrl;

  log.info("GET /auth/:provider/callback", { provider: providerName, userId });
  return c.redirect(redirectTarget);
}
