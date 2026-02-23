import { Google, GitHub } from "arctic";
import type { AuthConfig } from "./config";

export type OAuthProvider = Google | GitHub;

export function createProviders(config: AuthConfig): Map<string, OAuthProvider> {
  const providers = new Map<string, OAuthProvider>();

  if (config.google) {
    providers.set(
      "google",
      new Google(
        config.google.clientId,
        config.google.clientSecret,
        `${config.baseUrl}/auth/google/callback`,
      ),
    );
  }

  if (config.github) {
    providers.set(
      "github",
      new GitHub(
        config.github.clientId,
        config.github.clientSecret,
        `${config.baseUrl}/auth/github/callback`,
      ),
    );
  }

  return providers;
}

export function getProviderFromMap(
  providers: Map<string, OAuthProvider>,
  name: string,
): OAuthProvider | null {
  return providers.get(name) ?? null;
}
