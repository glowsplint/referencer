export function assertString(
  payload: Record<string, unknown>,
  key: string,
): string {
  const v = payload[key];
  if (v === undefined || v === null) {
    throw new Error(`key "${key}": missing`);
  }
  if (typeof v !== "string") {
    throw new Error(`key "${key}": expected string, got ${typeof v}`);
  }
  return v;
}

export function assertNumber(
  payload: Record<string, unknown>,
  key: string,
): number {
  const v = payload[key];
  if (v === undefined || v === null) {
    throw new Error(`key "${key}": missing`);
  }
  if (typeof v !== "number") {
    throw new Error(`key "${key}": expected number, got ${typeof v}`);
  }
  return v;
}

export function assertMap(
  payload: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const v = payload[key];
  if (v === undefined || v === null) {
    throw new Error(`key "${key}": missing`);
  }
  if (typeof v !== "object" || Array.isArray(v)) {
    throw new Error(`key "${key}": expected map, got ${typeof v}`);
  }
  return v as Record<string, unknown>;
}

export function assertSlice(
  payload: Record<string, unknown>,
  key: string,
): unknown[] {
  const v = payload[key];
  if (v === undefined || v === null) {
    throw new Error(`key "${key}": missing`);
  }
  if (!Array.isArray(v)) {
    throw new Error(`key "${key}": expected slice, got ${typeof v}`);
  }
  return v;
}
