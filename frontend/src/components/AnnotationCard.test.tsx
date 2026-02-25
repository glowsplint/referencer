import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnnotationCard } from "./AnnotationCard";
import { migrateAnnotation } from "../utils/migrateAnnotation";

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
  describe("when annotation is empty and not editing", () => {
    it("shows placeholder text", () => {
      render(<AnnotationCard {...createProps({ annotation: "" })} />);
      expect(screen.getByText("Add annotation...")).toBeTruthy();
    });
  });

  describe("when annotation has rich text HTML", () => {
    it("renders the HTML content", () => {
      const { container } = render(
        <AnnotationCard {...createProps({ annotation: "<p><strong>bold</strong> text</p>" })} />,
      );
      expect(container.querySelector("strong")).toBeTruthy();
      expect(container.textContent).toContain("bold text");
    });
  });

  describe("when annotation is plain text", () => {
    it("migrates it to HTML for display", () => {
      const { container } = render(
        <AnnotationCard {...createProps({ annotation: "plain text" })} />,
      );
      const html =
        container.querySelector("[dangerouslySetInnerHTML]") ??
        container.querySelector(".prose-xs");
      expect(html?.innerHTML).toContain("<p>plain text</p>");
    });
  });

  describe("when clicked in non-editing mode with annotation", () => {
    it("calls onClick with layerId and highlightId", () => {
      const onClick = vi.fn();
      render(<AnnotationCard {...createProps({ annotation: "<p>note</p>", onClick })} />);
      fireEvent.click(screen.getByText("note"));
      expect(onClick).toHaveBeenCalledWith("layer-1", "h1");
    });
  });

  describe("when collapsed", () => {
    it("hides the annotation text", () => {
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
      expect(container.textContent).not.toContain("test");
    });

    it("calls onToggleCollapse when clicked", () => {
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
  });

  describe("when expanded with onToggleCollapse provided", () => {
    it("shows a collapse button that triggers onToggleCollapse", () => {
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
      const button = container.querySelector("button");
      expect(button).toBeTruthy();
      fireEvent.click(button!);
      expect(onToggleCollapse).toHaveBeenCalledWith("h1");
    });
  });

  describe("when lastEdited is provided", () => {
    it("shows 'just now' for a recent timestamp", () => {
      const now = Date.now();
      render(<AnnotationCard {...createProps({ annotation: "<p>note</p>", lastEdited: now })} />);
      expect(screen.getByText("just now")).toBeTruthy();
    });

    it("shows relative time for older timestamps", () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      render(
        <AnnotationCard {...createProps({ annotation: "<p>note</p>", lastEdited: fiveMinAgo })} />,
      );
      expect(screen.getByText("5m ago")).toBeTruthy();
    });
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
    expect(migrateAnnotation("line1\n\nline2")).toBe("<p>line1</p><p><br></p><p>line2</p>");
  });

  it("returns HTML with leading whitespace before tag as-is", () => {
    expect(migrateAnnotation("  <p>spaced</p>")).toBe("  <p>spaced</p>");
  });
});
