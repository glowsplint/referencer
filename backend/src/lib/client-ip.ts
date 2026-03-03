export function getClientIp(c: { req: { header(name: string): string | undefined } }): string {
  return (
    c.req.header("x-real-client-ip") ??
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}
