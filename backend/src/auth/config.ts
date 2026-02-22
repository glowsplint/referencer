export interface AuthConfig {
  baseUrl: string;
  cookieSecure: boolean;
  sessionMaxAge: number; // seconds
  google: { clientId: string; clientSecret: string } | null;
  apple: {
    clientId: string;
    privateKey: string;
    teamId: string;
    keyId: string;
  } | null;
  facebook: { clientId: string; clientSecret: string } | null;
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

  const appleClientId = str("APPLE_CLIENT_ID");
  const applePrivateKey = str("APPLE_PRIVATE_KEY");
  const appleTeamId = str("APPLE_TEAM_ID");
  const appleKeyId = str("APPLE_KEY_ID");
  const apple =
    appleClientId && applePrivateKey && appleTeamId && appleKeyId
      ? {
          clientId: appleClientId,
          privateKey: applePrivateKey,
          teamId: appleTeamId,
          keyId: appleKeyId,
        }
      : null;

  const facebookClientId = str("FACEBOOK_CLIENT_ID");
  const facebookClientSecret = str("FACEBOOK_CLIENT_SECRET");
  const facebook =
    facebookClientId && facebookClientSecret
      ? { clientId: facebookClientId, clientSecret: facebookClientSecret }
      : null;

  return { baseUrl, cookieSecure, sessionMaxAge, google, apple, facebook };
}
