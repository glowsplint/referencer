import { Hono } from "hono";
import type { Env } from "../env";

export const pdf = new Hono<Env>();

// Upload PDF (base64 in JSON body to satisfy CSRF middleware)
// Note: The Supabase Storage bucket "document-pdfs" must exist.
pdf.post("/:id/pdf", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { id } = c.req.param();
  const body = await c.req.json<{ paneIndex: number; filename: string; data: string }>();

  if (!body.data || !body.filename) {
    return c.json({ error: "Missing required fields" }, 400);
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
pdf.get("/:id/pdf/:key{.+}", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const storageKey = c.req.param("key");
  const supabase = c.get("supabase");

  const { data, error } = await supabase.storage
    .from("document-pdfs")
    .createSignedUrl(storageKey, 3600); // 1 hour

  if (error || !data?.signedUrl) {
    return c.json({ error: "Failed to generate URL" }, 500);
  }

  return c.json({ url: data.signedUrl });
});
