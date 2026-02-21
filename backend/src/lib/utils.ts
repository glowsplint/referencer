const charset =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateCode(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

export function stringOrDefault(
  m: Record<string, unknown>,
  key: string,
  def: string,
): string {
  const v = m[key];
  if (typeof v === "string") {
    return v;
  }
  return def;
}
