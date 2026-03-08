import { Hono } from "hono";
import type { Env } from "../env";
import { requirePermission } from "../middleware/require-permission";

export const pdf = new Hono<Env>();

const MAX_PDF_BASE64_LENGTH = 20_000_000; // ~15MB binary

// Validate filename: alphanumeric, hyphens, underscores, dots only. No path separators.
function isValidFilename(name: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(name) && !name.includes("..");
}

// Upload PDF (base64 in JSON body to satisfy CSRF middleware)
// Note: The Supabase Storage bucket "document-pdfs" must exist.
pdf.post("/:id/pdf", requirePermission("editor"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const body = await c.req.json<{ paneIndex: number; filename: string; data: string }>();

  if (!body.data || !body.filename) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  // Validate paneIndex is a non-negative integer
  if (typeof body.paneIndex !== "number" || !Number.isInteger(body.paneIndex) || body.paneIndex < 0) {
    return c.json({ error: "paneIndex must be a non-negative integer" }, 400);
  }

  // Validate filename (no path traversal)
  if (!isValidFilename(body.filename)) {
    return c.json({ error: "Invalid filename" }, 400);
  }

  // Enforce size limit
  if (body.data.length > MAX_PDF_BASE64_LENGTH) {
    return c.json({ error: "File too large (max 15MB)" }, 413);
  }

  const supabase = c.get("supabase");

  // Decode base64 to binary
  const binaryStr = atob(body.data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const storageKey = `${id}/${body.paneIndex}/${body.filename}`;

  const { error: uploadError } = await supabase.storage
    .from("document-pdfs")
    .upload(storageKey, bytes.buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    const log = c.get("logger");
    log.error("PDF upload failed", { error: String(uploadError) });
    return c.json({ error: "Upload failed" }, 500);
  }

  return c.json({ storageKey });
});

// Get signed URL for PDF
pdf.get("/:id/pdf/:key{.+}", requirePermission("viewer"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const storageKey = c.req.param("key");

  // Validate the key belongs to this document (prevent path traversal)
  if (!storageKey.startsWith(`${id}/`)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const supabase = c.get("supabase");

  const { data, error } = await supabase.storage
    .from("document-pdfs")
    .createSignedUrl(storageKey, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return c.json({ error: "Failed to generate URL" }, 500);
  }

  return c.json({ url: data.signedUrl });
});
