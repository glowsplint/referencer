import { Google, Apple, Facebook } from "arctic";
import type { AuthConfig } from "./config";

let google: Google | null = null;
let apple: Apple | null = null;
let facebook: Facebook | null = null;

export function initProviders(config: AuthConfig): void {
  if (config.google) {
    google = new Google(
      config.google.clientId,
      config.google.clientSecret,
      `${config.baseUrl}/auth/google/callback`,
    );
  }
  if (config.apple) {
    apple = new Apple(
      config.apple.clientId,
      config.apple.teamId,
      config.apple.keyId,
      new TextEncoder().encode(config.apple.privateKey),
      `${config.baseUrl}/auth/apple/callback`,
    );
  }
  if (config.facebook) {
    facebook = new Facebook(
      config.facebook.clientId,
      config.facebook.clientSecret,
      `${config.baseUrl}/auth/facebook/callback`,
    );
  }
}

export function getProvider(
  name: string,
): Google | Apple | Facebook | null {
  switch (name) {
    case "google":
      return google;
    case "apple":
      return apple;
    case "facebook":
      return facebook;
    default:
      return null;
  }
}
