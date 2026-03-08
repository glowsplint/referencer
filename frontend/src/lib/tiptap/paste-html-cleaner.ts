import DOMPurify from "dompurify";

/** Detect Google Docs HTML by its internal marker */
export function isGoogleDocsHtml(html: string): boolean {
  return html.includes("docs-internal-guid");
}

/** Detect Microsoft Word HTML by Mso classes or Word XML */
export function isWordHtml(html: string): boolean {
  return /class="?Mso/i.test(html) || html.includes("urn:schemas-microsoft-com:office");
}

/** Clean Google Docs HTML */
export function cleanGoogleDocsHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  // Strip wrapper <b id="docs-internal-guid-..."> that Google falsely wraps everything in
  const wrapperBolds = doc.querySelectorAll('b[id^="docs-internal-guid"]');
  for (const b of wrapperBolds) {
    while (b.firstChild) b.parentNode?.insertBefore(b.firstChild, b);
    b.remove();
  }

  // Convert inline styles to semantic tags
  for (const span of doc.querySelectorAll("span")) {
    const style = span.style;
    const parent = span.parentNode;
    if (!parent) continue;

    let node: Node = span;

    if (style.fontWeight === "700" || style.fontWeight === "bold") {
      const strong = doc.createElement("strong");
      while (span.firstChild) strong.appendChild(span.firstChild);
      node = strong;
    }
    if (style.fontStyle === "italic") {
      const em = doc.createElement("em");
      if (node === span) {
        while (span.firstChild) em.appendChild(span.firstChild);
      } else {
        em.appendChild(node);
      }
      node = em;
    }
    if (style.textDecoration?.includes("underline")) {
      const u = doc.createElement("u");
      if (node === span) {
        while (span.firstChild) u.appendChild(span.firstChild);
      } else {
        u.appendChild(node);
      }
      node = u;
    }
    if (style.textDecoration?.includes("line-through")) {
      const s = doc.createElement("s");
      if (node === span) {
        while (span.firstChild) s.appendChild(span.firstChild);
      } else {
        s.appendChild(node);
      }
      node = s;
    }

    if (node !== span) {
      parent.replaceChild(node, span);
    }
  }

  // Unwrap Google redirect URLs
  for (const a of doc.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    try {
      const url = new URL(href);
      if (url.hostname.includes("google.com") && url.pathname === "/url") {
        const realUrl = url.searchParams.get("q");
        if (realUrl) a.setAttribute("href", realUrl);
      }
    } catch {
      // Invalid URL, leave as-is
    }
  }

  return doc.body.innerHTML;
}

/** Clean Microsoft Word HTML */
export function cleanWordHtml(html: string): string {
  // Strip <style> blocks
  let cleaned = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  // Strip <meta> tags
  cleaned = cleaned.replace(/<meta[^>]*\/?>/gi, "");
  // Strip Office-specific tags like <o:p>
  cleaned = cleaned.replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, "");
  // Strip conditional comments <!--[if ...]>...<![endif]-->
  cleaned = cleaned.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, "");
  // Strip Mso* classes
  cleaned = cleaned.replace(/\s*class="[^"]*Mso[^"]*"/gi, "");
  return cleaned;
}

/** Main dispatcher: detect source, clean, and sanitize */
export function cleanPastedHtml(html: string): string {
  let cleaned = html;
  if (isGoogleDocsHtml(html)) {
    cleaned = cleanGoogleDocsHtml(html);
  } else if (isWordHtml(html)) {
    cleaned = cleanWordHtml(html);
  }
  // Final sanitization: strip style, class, id attributes
  return DOMPurify.sanitize(cleaned, {
    FORBID_ATTR: ["style", "class", "id"],
    ALLOW_DATA_ATTR: false,
  });
}
