import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { highlightQueryInText } from "./highlight-query";

function renderToContainer(node: React.ReactNode) {
  const { container } = render(<span>{node}</span>);
  return container.querySelector("span")!;
}

describe("highlightQueryInText", () => {
  it("wraps match in <strong> element", () => {
    const result = highlightQueryInText("hello world", "world");
    const el = renderToContainer(result);
    const strong = el.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe("world");
  });

  it("matches case-insensitively", () => {
    const result = highlightQueryInText("Hello World", "hello");
    const el = renderToContainer(result);
    const strong = el.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe("Hello");
  });

  it("truncates long text with ellipsis character", () => {
    const longText = "a".repeat(50);
    const result = highlightQueryInText(longText, "xyz", 20);
    // No match found, so it truncates with ellipsis
    expect(typeof result).toBe("string");
    expect(result as string).toHaveLength(21); // 20 chars + ellipsis
    expect((result as string).endsWith("\u2026")).toBe(true);
  });

  it("returns plain text string when no match found", () => {
    const result = highlightQueryInText("hello world", "xyz");
    expect(typeof result).toBe("string");
    expect(result).toBe("hello world");
  });

  it("returns plain text string for empty query", () => {
    const result = highlightQueryInText("hello world", "");
    expect(typeof result).toBe("string");
    expect(result).toBe("hello world");
  });

  it("match is visible in truncated text", () => {
    // Match near the end of a long string
    const longText = "a".repeat(40) + "TARGET" + "b".repeat(40);
    const result = highlightQueryInText(longText, "TARGET", 20);
    const el = renderToContainer(result);
    const strong = el.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe("TARGET");
    // Should contain ellipsis since text was truncated
    expect(el.textContent).toContain("\u2026");
  });

  it("returns empty string for null/undefined text", () => {
    const resultNull = highlightQueryInText(null as unknown as string, "query");
    expect(resultNull).toBe("");
    const resultUndefined = highlightQueryInText(undefined as unknown as string, "query");
    expect(resultUndefined).toBe("");
  });
});
