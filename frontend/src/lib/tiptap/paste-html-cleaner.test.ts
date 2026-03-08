import { describe, it, expect } from "vitest";
import {
  isGoogleDocsHtml,
  isWordHtml,
  cleanGoogleDocsHtml,
  cleanWordHtml,
  cleanPastedHtml,
} from "./paste-html-cleaner";

describe("isGoogleDocsHtml", () => {
  it("returns true for HTML containing docs-internal-guid", () => {
    const html = '<b id="docs-internal-guid-abc123"><span>Hello</span></b>';
    expect(isGoogleDocsHtml(html)).toBe(true);
  });

  it("returns false for plain HTML", () => {
    expect(isGoogleDocsHtml("<p>Hello world</p>")).toBe(false);
  });
});

describe("isWordHtml", () => {
  it("returns true for HTML with class MsoNormal", () => {
    const html = '<p class="MsoNormal">Hello</p>';
    expect(isWordHtml(html)).toBe(true);
  });

  it("returns true for HTML with Word XML namespace", () => {
    const html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body>Hello</body></html>';
    expect(isWordHtml(html)).toBe(true);
  });

  it("returns false for plain HTML", () => {
    expect(isWordHtml("<p>Hello world</p>")).toBe(false);
  });
});

describe("cleanGoogleDocsHtml", () => {
  it("strips docs-internal-guid wrapper bold", () => {
    const html = '<b id="docs-internal-guid-abc123"><p>Hello</p></b>';
    const result = cleanGoogleDocsHtml(html);
    expect(result).not.toContain("docs-internal-guid");
    expect(result).toContain("<p>Hello</p>");
  });

  it("converts font-weight:700 spans to <strong>", () => {
    const html = '<span style="font-weight:700">Bold text</span>';
    const result = cleanGoogleDocsHtml(html);
    expect(result).toContain("<strong>Bold text</strong>");
  });

  it("converts font-style:italic spans to <em>", () => {
    const html = '<span style="font-style:italic">Italic text</span>';
    const result = cleanGoogleDocsHtml(html);
    expect(result).toContain("<em>Italic text</em>");
  });

  it("converts text-decoration:underline to <u>", () => {
    const html = '<span style="text-decoration:underline">Underlined</span>';
    const result = cleanGoogleDocsHtml(html);
    expect(result).toContain("<u>Underlined</u>");
  });

  it("converts text-decoration:line-through to <s>", () => {
    const html = '<span style="text-decoration:line-through">Struck</span>';
    const result = cleanGoogleDocsHtml(html);
    expect(result).toContain("<s>Struck</s>");
  });

  it("unwraps Google redirect URLs", () => {
    const html = '<a href="https://www.google.com/url?q=https://example.com&sa=D">Link</a>';
    const result = cleanGoogleDocsHtml(html);
    expect(result).toContain('href="https://example.com"');
    expect(result).not.toContain("google.com/url");
  });
});

describe("cleanWordHtml", () => {
  it("strips <style> blocks", () => {
    const html = '<style type="text/css">p { color: red; }</style><p>Hello</p>';
    const result = cleanWordHtml(html);
    expect(result).not.toContain("<style");
    expect(result).toContain("<p>Hello</p>");
  });

  it("strips <o:p> elements", () => {
    const html = "<p>Hello<o:p></o:p></p>";
    const result = cleanWordHtml(html);
    expect(result).not.toContain("<o:p>");
    expect(result).toContain("<p>Hello</p>");
  });

  it("strips conditional comments", () => {
    const html = "<!--[if gte mso 9]><xml>office stuff</xml><![endif]--><p>Hello</p>";
    const result = cleanWordHtml(html);
    expect(result).not.toContain("<!--[if");
    expect(result).toContain("<p>Hello</p>");
  });

  it("strips Mso classes", () => {
    const html = '<p class="MsoNormal">Hello</p>';
    const result = cleanWordHtml(html);
    expect(result).not.toContain("MsoNormal");
    expect(result).toContain("<p>Hello</p>");
  });
});

describe("cleanPastedHtml", () => {
  it("dispatches to Google Docs cleaner for Google Docs HTML", () => {
    const html = '<b id="docs-internal-guid-abc"><span style="font-weight:700">Bold</span></b>';
    const result = cleanPastedHtml(html);
    expect(result).toContain("<strong>");
    expect(result).not.toContain("docs-internal-guid");
  });

  it("dispatches to Word cleaner for Word HTML", () => {
    const html = '<style>p{}</style><p class="MsoNormal">Hello<o:p></o:p></p>';
    const result = cleanPastedHtml(html);
    expect(result).not.toContain("<style");
    expect(result).not.toContain("MsoNormal");
    expect(result).not.toContain("<o:p>");
  });

  it("sanitizes and strips style/class/id attributes", () => {
    const html = '<p style="color:red" class="foo" id="bar">Hello</p>';
    const result = cleanPastedHtml(html);
    expect(result).not.toContain("style=");
    expect(result).not.toContain("class=");
    expect(result).not.toContain("id=");
    expect(result).toContain("Hello");
  });

  it("passes through unknown HTML with sanitization", () => {
    const html = '<p style="color:red">Regular paste</p>';
    const result = cleanPastedHtml(html);
    expect(result).not.toContain("style=");
    expect(result).toContain("Regular paste");
  });
});
