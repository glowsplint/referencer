import { Google, Apple, Facebook } from "arctic";
import type { AuthConfig } from "./config";

export function createProviders(config: AuthConfig): Map<string, Google | Apple | Facebook> {
  const providers = new Map<string, Google | Apple | Facebook>();

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

  if (config.apple) {
    providers.set(
      "apple",
      new Apple(
        config.apple.clientId,
        config.apple.teamId,
        config.apple.keyId,
        new TextEncoder().encode(config.apple.privateKey),
        `${config.baseUrl}/auth/apple/callback`,
      ),
    );
  }

  if (config.facebook) {
    providers.set(
      "facebook",
      new Facebook(
        config.facebook.clientId,
        config.facebook.clientSecret,
        `${config.baseUrl}/auth/facebook/callback`,
      ),
    );
  }

  return providers;
}

export function getProviderFromMap(
  providers: Map<string, Google | Apple | Facebook>,
  name: string,
): Google | Apple | Facebook | null {
  return providers.get(name) ?? null;
}
