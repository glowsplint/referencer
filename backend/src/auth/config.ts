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

export function loadAuthConfig(): AuthConfig {
  const baseUrl = process.env.BASE_URL ?? "http://localhost:5000";
  const cookieSecure = process.env.NODE_ENV === "production";
  const sessionMaxAge = Number(process.env.SESSION_MAX_AGE ?? 2592000); // 30 days

  const google =
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }
      : null;

  const apple =
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_PRIVATE_KEY &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID
      ? {
          clientId: process.env.APPLE_CLIENT_ID,
          privateKey: process.env.APPLE_PRIVATE_KEY,
          teamId: process.env.APPLE_TEAM_ID,
          keyId: process.env.APPLE_KEY_ID,
        }
      : null;

  const facebook =
    process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? {
          clientId: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        }
      : null;

  return { baseUrl, cookieSecure, sessionMaxAge, google, apple, facebook };
}
