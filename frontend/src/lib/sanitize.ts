import DOMPurify, { type Config } from "dompurify";

const SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "span",
    "sub",
    "sup",
    "hr",
    "img",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "class"],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}
