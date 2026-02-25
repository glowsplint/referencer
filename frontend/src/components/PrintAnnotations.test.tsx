import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PrintAnnotations } from "./PrintAnnotations";
import type { Layer } from "@/types/editor";

function makeLayer(overrides: Partial<Layer> = {}): Layer {
  return {
    id: "l1",
    name: "Layer 1",
    color: "#fca5a5",
    visible: true,
    highlights: [],
    arrows: [],
    underlines: [],
    ...overrides,
  };
}

describe("PrintAnnotations", () => {
  describe("when no visible comments exist", () => {
    it("then renders nothing", () => {
      const { container } = render(
        <PrintAnnotations
          layers={[makeLayer()]}
          sectionNames={["Passage 1"]}
          sectionVisibility={[true]}
        />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when layer is hidden", () => {
    it("then renders nothing even if comments exist", () => {
      const layer = makeLayer({
        visible: false,
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "note",
            type: "comment",
          },
        ],
      });
      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Passage 1"]}
          sectionVisibility={[true]}
        />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when highlights are type 'highlight' (not comments)", () => {
    it("then renders nothing", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "",
            type: "highlight",
          },
        ],
      });
      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Passage 1"]}
          sectionVisibility={[true]}
        />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when comments exist across multiple passages", () => {
    it("then groups annotations by passage", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "first note",
            type: "comment",
          },
          {
            id: "h2",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "world",
            annotation: "second note",
            type: "comment",
          },
        ],
      });

      render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Intro", "Body"]}
          sectionVisibility={[true, true]}
        />,
      );

      expect(screen.getByText("Comments")).toBeInTheDocument();
      expect(screen.getByText("Intro")).toBeInTheDocument();
      expect(screen.getByText("Body")).toBeInTheDocument();
    });
  });

  describe("when a comment has quoted text and annotation", () => {
    it("then displays both the quoted text and the annotation content", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "selected text",
            annotation: "<p>my comment</p>",
            type: "comment",
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Passage 1"]}
          sectionVisibility={[true]}
        />,
      );

      expect(container.textContent).toContain("selected text");
      expect(container.textContent).toContain("my comment");
    });
  });

  describe("when a section is hidden", () => {
    it("then excludes comments from that section", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "visible",
            annotation: "shown",
            type: "comment",
          },
          {
            id: "h2",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "hidden",
            annotation: "not shown",
            type: "comment",
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Intro", "Body"]}
          sectionVisibility={[true, false]}
        />,
      );

      expect(container.textContent).toContain("shown");
      expect(container.textContent).not.toContain("not shown");
    });
  });

  describe("when annotation is plain text (not HTML)", () => {
    it("then migrates it to HTML for display", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "hello",
            annotation: "plain text note",
            type: "comment",
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Passage 1"]}
          sectionVisibility={[true]}
        />,
      );

      const proseEl = container.querySelector(".prose-xs");
      expect(proseEl?.innerHTML).toContain("<p>plain text note</p>");
    });
  });
});
