const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateCode(length: number = 12): string {
  const max = 256 - (256 % charset.length); // reject values >= max to avoid bias
  let result = "";
  while (result.length < length) {
    const bytes = new Uint8Array(length - result.length);
    crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < max && result.length < length) {
        result += charset[b % charset.length];
      }
    }
  }
  return result;
}
