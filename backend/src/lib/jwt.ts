/** Sign a short-lived JWT using HMAC-SHA256 (Web Crypto API). Zero dependencies. */

export interface WsJwtPayload {
  sub: string;
  room: string;
  iss: string;
  aud: string;
  exp: number;
}

function base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function signJwt(payload: WsJwtPayload, secret: string): Promise<string> {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64urlEncode(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${header}.${body}`);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${header}.${body}.${base64url(sig)}`;
}
