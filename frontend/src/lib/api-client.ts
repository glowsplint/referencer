/** Thin fetch wrapper with centralized API_URL, credentials, and error handling. */

const API_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(apiUrl(path), {
    credentials: "include",
    ...options,
    headers: {
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `API ${options.method ?? "GET"} ${path} failed: ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return null as T;
  }
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null as T;
  }
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

export async function apiPatch<T = unknown>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
}
