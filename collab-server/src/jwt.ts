/** Verify a JWT signed with HMAC-SHA256 (Web Crypto API). Zero dependencies. */

export interface WsJwtPayload {
  sub: string;
  room: string;
  iss: string;
  aud: string;
  exp: number;
}

function base64urlDecode(str: string): string {
  return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
}

export async function verifyJwt(token: string, secret: string): Promise<WsJwtPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const data = new TextEncoder().encode(`${header}.${body}`);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  // Decode the signature from base64url
  const sigStr = atob(sig.replace(/-/g, "+").replace(/_/g, "/"));
  const sigBuf = new Uint8Array(sigStr.length);
  for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);

  const valid = await crypto.subtle.verify("HMAC", key, sigBuf, data);
  if (!valid) return null;

  const payload: WsJwtPayload = JSON.parse(base64urlDecode(body));

  // Check expiry
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}
