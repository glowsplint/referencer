import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateState, generateCodeVerifier, Google, GitHub } from "arctic";
import { kvRateLimiter } from "../lib/rate-limit";
import { createProviders, getProviderFromMap, type OAuthProvider } from "./providers";
import { loadAuthConfig, type AuthConfig } from "./config";
import { upsertUser, createSession, getSessionUser, deleteSession } from "./store";
import type { Env } from "../env";

interface AuthState {
  state: string;
  codeVerifier?: string;
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

    return c.json({ authenticated: true, user });
  });

  // POST /auth/logout
  auth.post("/logout", authLogoutLimiter, async (c) => {
    const token = getCookie(c, "__session");
    if (token) {
      const supabase = c.get("supabase");
      await deleteSession(supabase, token);
    }
    deleteCookie(c, "__session", { path: "/" });
    return c.json({ ok: true });
  });

  // GET /auth/:provider — start OAuth flow
  auth.get("/:provider", authStartLimiter, (c) => {
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

    // Store state in cookie (10 minute expiry).
    setCookie(c, "__auth_state", JSON.stringify(authState), {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      path: "/",
      maxAge: 600,
    });

    return c.redirect(authUrl.toString());
  });

  // GET /auth/:provider/callback
  auth.get("/:provider/callback", authCallbackLimiter, async (c) => {
    const config = loadAuthConfig(c.env);
    return handleCallback(c, config);
  });

  return auth;
}

async function handleCallback(c: any, config: AuthConfig) {
  const providerName = c.req.param("provider");
  const providers = createProviders(config);
  const provider = getProviderFromMap(providers, providerName);
  if (!provider) {
    return c.json({ error: `Unknown provider: ${providerName}` }, 404);
  }

  const frontendUrl: string = c.env.FRONTEND_URL ?? "http://localhost:5173";

  // Read state from cookie.
  const stateCookie = getCookie(c, "__auth_state");
  deleteCookie(c, "__auth_state", { path: "/" });

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
    console.error("Token exchange failed:", err);
    return c.json({ error: "Token exchange failed" }, 400);
  }

  let providerUserId: string;
  let email: string;
  let name: string;
  let avatarUrl: string;

  if (provider instanceof Google) {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    const profile = (await res.json()) as any;
    providerUserId = profile.sub;
    email = profile.email ?? "";
    name = profile.name ?? "";
    avatarUrl = profile.picture ?? "";
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
    }
  }

  if (!email) {
    return c.json({ error: "Could not retrieve email from provider" }, 400);
  }

  // Upsert user and create session.
  const supabase = c.get("supabase");
  const userId = await upsertUser(supabase, providerName, providerUserId, email, name, avatarUrl);
  const sessionToken = await createSession(supabase, userId, config.sessionMaxAge);

  setCookie(c, "__session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: config.sessionMaxAge,
  });

  return c.redirect(frontendUrl);
}
