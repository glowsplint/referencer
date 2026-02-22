import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnnotationCard, migrateAnnotation } from "./AnnotationCard";

function createProps(overrides: Partial<Parameters<typeof AnnotationCard>[0]> = {}) {
  return {
    layerId: "layer-1",
    highlightId: "h1",
    color: "#fca5a5",
    annotation: "",
    isEditing: false,
    top: 40,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onClick: vi.fn(),
    ...overrides,
  };
}

describe("AnnotationCard", () => {
  it("calls onClick when clicked in non-editing mode with annotation", () => {
    const onClick = vi.fn();
    render(<AnnotationCard {...createProps({ annotation: "<p>note</p>", onClick })} />);

    fireEvent.click(screen.getByText("note"));

    expect(onClick).toHaveBeenCalledWith("layer-1", "h1");
  });

  it("shows placeholder text when annotation is empty and not editing", () => {
    render(<AnnotationCard {...createProps({ annotation: "" })} />);

    expect(screen.getByText("Add annotation...")).toBeTruthy();
  });

  it("renders rich text HTML annotation in non-editing mode", () => {
    const { container } = render(
      <AnnotationCard {...createProps({ annotation: "<p><strong>bold</strong> text</p>" })} />,
    );

    expect(container.querySelector("strong")).toBeTruthy();
    expect(container.textContent).toContain("bold text");
  });

  it("migrates plain text annotation to HTML for display", () => {
    const { container } = render(
      <AnnotationCard {...createProps({ annotation: "plain text" })} />,
    );

    const html = container.querySelector("[dangerouslySetInnerHTML]") ?? container.querySelector(".prose-xs");
    expect(html?.innerHTML).toContain("<p>plain text</p>");
  });

  it("renders collapsed state with chevron down", () => {
    const onToggleCollapse = vi.fn();
    const { container } = render(
      <AnnotationCard
        {...createProps({
          annotation: "<p>test</p>",
          isCollapsed: true,
          onToggleCollapse,
        })}
      />,
    );

    // Collapsed card should not show annotation text
    expect(container.textContent).not.toContain("test");
  });

  it("calls onToggleCollapse when collapsed card is clicked", () => {
    const onToggleCollapse = vi.fn();
    const { container } = render(
      <AnnotationCard
        {...createProps({
          annotation: "<p>test</p>",
          isCollapsed: true,
          onToggleCollapse,
        })}
      />,
    );

    const card = container.querySelector("[data-highlight-id]")!;
    fireEvent.click(card);
    expect(onToggleCollapse).toHaveBeenCalledWith("h1");
  });

  it("shows collapse button on non-collapsed card when onToggleCollapse is provided", () => {
    const onToggleCollapse = vi.fn();
    const { container } = render(
      <AnnotationCard
        {...createProps({
          annotation: "<p>test</p>",
          isCollapsed: false,
          onToggleCollapse,
        })}
      />,
    );

    // ChevronUp button should exist
    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    fireEvent.click(button!);
    expect(onToggleCollapse).toHaveBeenCalledWith("h1");
  });

  it("renders timestamp when lastEdited is provided", () => {
    const now = Date.now();
    render(
      <AnnotationCard
        {...createProps({ annotation: "<p>note</p>", lastEdited: now })}
      />,
    );

    expect(screen.getByText("just now")).toBeTruthy();
  });

  it("renders timestamp for minutes ago", () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    render(
      <AnnotationCard
        {...createProps({ annotation: "<p>note</p>", lastEdited: fiveMinAgo })}
      />,
    );

    expect(screen.getByText("5m ago")).toBeTruthy();
  });

  it("renders color strip at top", () => {
    const { container } = render(
      <AnnotationCard {...createProps({ color: "#86efac" })} />,
    );

    const colorStrip = container.querySelector(".h-1.rounded-t");
    expect(colorStrip).toBeTruthy();
    expect((colorStrip as HTMLElement).style.backgroundColor).toBe("rgb(134, 239, 172)");
  });

  it("positions card at the given top offset", () => {
    const { container } = render(
      <AnnotationCard {...createProps({ top: 120 })} />,
    );

    const card = container.querySelector("[data-highlight-id]") as HTMLElement;
    expect(card.style.top).toBe("120px");
  });
});

describe("migrateAnnotation", () => {
  it("returns empty string for empty input", () => {
    expect(migrateAnnotation("")).toBe("");
  });

  it("returns HTML as-is when it starts with a tag", () => {
    expect(migrateAnnotation("<p>hello</p>")).toBe("<p>hello</p>");
  });

  it("wraps plain text in paragraph tags", () => {
    expect(migrateAnnotation("hello")).toBe("<p>hello</p>");
  });

  it("wraps multi-line text with each line in paragraph tags", () => {
    expect(migrateAnnotation("line1\nline2")).toBe("<p>line1</p><p>line2</p>");
  });

  it("converts empty lines to <p><br></p>", () => {
    expect(migrateAnnotation("line1\n\nline2")).toBe(
      "<p>line1</p><p><br></p><p>line2</p>",
    );
  });

  it("returns HTML with leading whitespace before tag as-is", () => {
    expect(migrateAnnotation("  <p>spaced</p>")).toBe("  <p>spaced</p>");
  });
});
