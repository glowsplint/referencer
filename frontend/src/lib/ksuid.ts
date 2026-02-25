// Browser-compatible KSUID generator.
// KSUIDs are 20 bytes: 4-byte timestamp (seconds since KSUID epoch) + 16-byte random payload,
// encoded as a 27-character base62 string.

const EPOCH_IN_MS = 14e11; // KSUID epoch: 2014-05-13T16:53:20Z
const TIMESTAMP_BYTES = 4;
const PAYLOAD_BYTES = 16;
const TOTAL_BYTES = TIMESTAMP_BYTES + PAYLOAD_BYTES;
const STRING_LENGTH = 27;

const BASE62_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function encodeBase62(bytes: Uint8Array): string {
  // Convert bytes to a big integer, then encode in base62
  let n = 0n;
  for (const b of bytes) {
    n = (n << 8n) | BigInt(b);
  }

  const chars: string[] = [];
  const base = 62n;
  while (n > 0n) {
    chars.push(BASE62_CHARS[Number(n % base)]);
    n = n / base;
  }

  // Pad to 27 characters
  while (chars.length < STRING_LENGTH) {
    chars.push("0");
  }

  return chars.reverse().join("");
}

export function randomKSUID(): string {
  const timestamp = Math.floor((Date.now() - EPOCH_IN_MS) / 1e3);

  const buffer = new Uint8Array(TOTAL_BYTES);
  // Write timestamp as big-endian uint32
  buffer[0] = (timestamp >>> 24) & 0xff;
  buffer[1] = (timestamp >>> 16) & 0xff;
  buffer[2] = (timestamp >>> 8) & 0xff;
  buffer[3] = timestamp & 0xff;

  // Fill payload with random bytes
  crypto.getRandomValues(buffer.subarray(TIMESTAMP_BYTES));

  return encodeBase62(buffer);
}
