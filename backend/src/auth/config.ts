export interface AuthConfig {
  baseUrl: string;
  cookieSecure: boolean;
  sessionMaxAge: number; // seconds
  google: { clientId: string; clientSecret: string } | null;
  github: { clientId: string; clientSecret: string } | null;
}

export function loadAuthConfig(env: Record<string, unknown>): AuthConfig {
  const str = (key: string): string | undefined => {
    const v = env[key];
    return typeof v === "string" ? v : undefined;
  };

  const baseUrl = str("BASE_URL") ?? "http://localhost:8787";
  const cookieSecure = true;
  const sessionMaxAge = Number(str("SESSION_MAX_AGE") ?? 2592000); // 30 days

  const googleClientId = str("GOOGLE_CLIENT_ID");
  const googleClientSecret = str("GOOGLE_CLIENT_SECRET");
  const google =
    googleClientId && googleClientSecret
      ? { clientId: googleClientId, clientSecret: googleClientSecret }
      : null;

  const githubClientId = str("GITHUB_CLIENT_ID");
  const githubClientSecret = str("GITHUB_CLIENT_SECRET");
  const github =
    githubClientId && githubClientSecret
      ? { clientId: githubClientId, clientSecret: githubClientSecret }
      : null;

  return { baseUrl, cookieSecure, sessionMaxAge, google, github };
}
