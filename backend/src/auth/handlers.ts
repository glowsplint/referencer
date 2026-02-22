import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateState, generateCodeVerifier, decodeIdToken } from "arctic";
import type { Google, Apple, Facebook } from "arctic";
import { kvRateLimiter } from "../lib/rate-limit";
import { createProviders, getProviderFromMap } from "./providers";
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

    if (providerName === "google") {
      const codeVerifier = generateCodeVerifier();
      authState.codeVerifier = codeVerifier;
      authUrl = (provider as Google).createAuthorizationURL(state, codeVerifier, [
        "openid",
        "email",
        "profile",
      ]);
    } else if (providerName === "apple") {
      authUrl = (provider as Apple).createAuthorizationURL(state, ["name", "email"]);
    } else if (providerName === "facebook") {
      authUrl = (provider as Facebook).createAuthorizationURL(state, [
        "email",
        "public_profile",
      ]);
    } else {
      return c.json({ error: "Unsupported provider" }, 400);
    }

    // Store state in cookie (10 minute expiry).
    setCookie(c, "__auth_state", JSON.stringify(authState), {
      httpOnly: true,
      secure: true,
      sameSite: "None",
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

  // POST /auth/:provider/callback — Apple uses POST for callback
  auth.post("/:provider/callback", authCallbackLimiter, async (c) => {
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

  // Get code and state from query params or form body.
  let code: string | undefined;
  let returnedState: string | undefined;

  if (c.req.method === "POST") {
    const body = await c.req.parseBody();
    code = body.code as string;
    returnedState = body.state as string;
  } else {
    code = c.req.query("code");
    returnedState = c.req.query("state");
  }

  if (!code || !returnedState) {
    return c.json({ error: "Missing code or state" }, 400);
  }

  if (returnedState !== authState.state) {
    return c.json({ error: "State mismatch" }, 400);
  }

  // Exchange code for tokens.
  let tokens: any;
  try {
    if (providerName === "google") {
      tokens = await (provider as Google).validateAuthorizationCode(
        code,
        authState.codeVerifier!,
      );
    } else if (providerName === "apple") {
      tokens = await (provider as Apple).validateAuthorizationCode(code);
    } else if (providerName === "facebook") {
      tokens = await (provider as Facebook).validateAuthorizationCode(code);
    }
  } catch (err) {
    console.error("Token exchange failed:", err);
    return c.json({ error: "Token exchange failed" }, 400);
  }

  // Extract user info from provider.
  let email = "";
  let name = "";
  let avatarUrl = "";
  let providerUserId = "";

  if (providerName === "google") {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken()}` },
    });
    const profile = (await res.json()) as any;
    providerUserId = profile.sub;
    email = profile.email ?? "";
    name = profile.name ?? "";
    avatarUrl = profile.picture ?? "";
  } else if (providerName === "apple") {
    const claims = decodeIdToken(tokens.idToken()) as any;
    providerUserId = claims.sub;
    email = claims.email ?? "";
    if (c.req.method === "POST") {
      const body = await c.req.parseBody();
      if (body.user) {
        try {
          const userInfo = JSON.parse(body.user as string);
          name =
            [userInfo.name?.firstName, userInfo.name?.lastName].filter(Boolean).join(" ") || "";
        } catch {
          // ignore
        }
      }
    }
  } else if (providerName === "facebook") {
    const res = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokens.accessToken()}`,
    );
    const profile = (await res.json()) as any;
    providerUserId = profile.id;
    email = profile.email ?? "";
    name = profile.name ?? "";
    avatarUrl = profile.picture?.data?.url ?? "";
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
    sameSite: "None",
    path: "/",
    maxAge: config.sessionMaxAge,
  });

  return c.redirect(frontendUrl);
}
