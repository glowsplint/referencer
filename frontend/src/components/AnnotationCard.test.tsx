import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnnotationCard } from "./AnnotationCard";
import { migrateAnnotation } from "@/lib/annotation/migrate-annotation";

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
    it("then shows placeholder text", () => {
      render(<AnnotationCard {...createProps({ annotation: "" })} />);
      expect(screen.getByText("Add annotation...")).toBeTruthy();
    });
  });

  describe("when annotation has rich text HTML", () => {
    it("then renders the HTML content", () => {
      const { container } = render(
        <AnnotationCard {...createProps({ annotation: "<p><strong>bold</strong> text</p>" })} />,
      );
      expect(container.querySelector("strong")).toBeTruthy();
      expect(container.textContent).toContain("bold text");
    });
  });

  describe("when annotation is plain text", () => {
    it("then migrates it to HTML for display", () => {
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
    it("then calls onClick with layerId and highlightId", () => {
      const onClick = vi.fn();
      render(<AnnotationCard {...createProps({ annotation: "<p>note</p>", onClick })} />);
      fireEvent.click(screen.getByText("note"));
      expect(onClick).toHaveBeenCalledWith("layer-1", "h1");
    });
  });

  describe("when collapsed", () => {
    it("then hides the annotation text", () => {
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

    it("then calls onToggleCollapse when clicked", () => {
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
    it("then shows a collapse button that triggers onToggleCollapse", () => {
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
    it("then shows 'just now' for a recent timestamp", () => {
      const now = Date.now();
      render(<AnnotationCard {...createProps({ annotation: "<p>note</p>", lastEdited: now })} />);
      expect(screen.getByText("just now")).toBeTruthy();
    });

    it("then shows relative time for older timestamps", () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      render(
        <AnnotationCard {...createProps({ annotation: "<p>note</p>", lastEdited: fiveMinAgo })} />,
      );
      expect(screen.getByText("5m ago")).toBeTruthy();
    });
  });
});

describe("migrateAnnotation", () => {
  describe("when given empty input", () => {
    it("then returns empty string", () => {
      expect(migrateAnnotation("")).toBe("");
    });
  });

  describe("when given HTML input starting with a tag", () => {
    it("then returns HTML as-is", () => {
      expect(migrateAnnotation("<p>hello</p>")).toBe("<p>hello</p>");
    });
  });

  describe("when given plain text", () => {
    it("then wraps it in paragraph tags", () => {
      expect(migrateAnnotation("hello")).toBe("<p>hello</p>");
    });
  });

  describe("when given multi-line text", () => {
    it("then wraps each line in paragraph tags", () => {
      expect(migrateAnnotation("line1\nline2")).toBe("<p>line1</p><p>line2</p>");
    });
  });

  describe("when given text with empty lines", () => {
    it("then converts empty lines to <p><br></p>", () => {
      expect(migrateAnnotation("line1\n\nline2")).toBe("<p>line1</p><p><br></p><p>line2</p>");
    });
  });

  describe("when given HTML with leading whitespace before tag", () => {
    it("then returns it as-is", () => {
      expect(migrateAnnotation("  <p>spaced</p>")).toBe("  <p>spaced</p>");
    });
  });
});
