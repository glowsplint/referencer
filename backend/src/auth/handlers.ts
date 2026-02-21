import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateState, generateCodeVerifier, decodeIdToken } from "arctic";
import type { Database } from "bun:sqlite";
import type { Google, Apple, Facebook } from "arctic";
import { rateLimiter } from "hono-rate-limiter";
import { getProvider } from "./providers";
import type { AuthConfig } from "./config";
import { upsertUser, createSession, getSessionUser, deleteSession } from "./store";

interface AuthState {
  state: string;
  codeVerifier?: string;
}

const authStartLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown",
});

const authCallbackLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 5,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown",
});

const authLogoutLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10,
  keyGenerator: (c) =>
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown",
});

export function createAuthRoutes(db: Database, config: AuthConfig) {
  const auth = new Hono();

  // GET /auth/me — must be registered before /:provider to avoid shadowing
  auth.get("/me", (c) => {
    const token = getCookie(c, "__session");
    if (!token) {
      return c.json({ authenticated: false });
    }

    const user = getSessionUser(db, token);
    if (!user) {
      deleteCookie(c, "__session", { path: "/" });
      return c.json({ authenticated: false });
    }

    return c.json({ authenticated: true, user });
  });

  // POST /auth/logout — must be registered before /:provider to avoid shadowing
  auth.post("/logout", authLogoutLimiter, (c) => {
    const token = getCookie(c, "__session");
    if (token) {
      deleteSession(db, token);
    }
    deleteCookie(c, "__session", { path: "/" });
    return c.json({ ok: true });
  });

  // GET /auth/:provider — start OAuth flow
  auth.get("/:provider", authStartLimiter, (c) => {
    const providerName = c.req.param("provider");
    const provider = getProvider(providerName);
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
      authUrl = (provider as Facebook).createAuthorizationURL(state, ["email", "public_profile"]);
    } else {
      return c.json({ error: "Unsupported provider" }, 400);
    }

    // Store state in cookie (10 minute expiry).
    setCookie(c, "__auth_state", JSON.stringify(authState), {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: providerName === "apple" ? "None" : "Lax",
      path: "/",
      maxAge: 600,
    });

    return c.redirect(authUrl.toString());
  });

  // GET /auth/:provider/callback — handle OAuth callback
  auth.get("/:provider/callback", authCallbackLimiter, async (c) => {
    return handleCallback(c, db, config);
  });

  // POST /auth/:provider/callback — Apple uses POST for callback
  auth.post("/:provider/callback", authCallbackLimiter, async (c) => {
    return handleCallback(c, db, config);
  });

  return auth;
}

async function handleCallback(c: any, db: Database, config: AuthConfig) {
  const providerName = c.req.param("provider");
  const provider = getProvider(providerName);
  if (!provider) {
    return c.json({ error: `Unknown provider: ${providerName}` }, 404);
  }

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
      tokens = await (provider as Google).validateAuthorizationCode(code, authState.codeVerifier!);
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
    // Apple includes user info in the ID token (JWT).
    const claims = decodeIdToken(tokens.idToken()) as any;
    providerUserId = claims.sub;
    email = claims.email ?? "";
    // Apple may send name in the first callback only, via POST body.
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
  const userId = upsertUser(db, providerName, providerUserId, email, name, avatarUrl);
  const sessionToken = createSession(db, userId, config.sessionMaxAge);

  setCookie(c, "__session", sessionToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: "Lax",
    path: "/",
    maxAge: config.sessionMaxAge,
  });

  return c.redirect("/");
}
