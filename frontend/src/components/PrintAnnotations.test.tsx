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
          sectionNames={["Text 1"]}
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
            visible: true,
          },
        ],
      });
      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when highlights are type 'highlight' (not comments)", () => {
    it("then renders them in the Highlights section", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "highlighted text",
            annotation: "",
            type: "highlight",
            visible: true,
          },
        ],
      });
      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );
      expect(screen.getByText("Highlights")).toBeInTheDocument();
      expect(container.textContent).toContain("highlighted text");
    });
  });

  describe("when comments exist across multiple texts", () => {
    it("then groups annotations by text", () => {
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
            visible: true,
          },
          {
            id: "h2",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "world",
            annotation: "second note",
            type: "comment",
            visible: true,
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
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
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
            visible: true,
          },
          {
            id: "h2",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "hidden",
            annotation: "not shown",
            type: "comment",
            visible: true,
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
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );

      const proseEl = container.querySelector(".prose-xs");
      expect(proseEl?.innerHTML).toContain("<p>plain text note</p>");
    });
  });

  describe("highlights rendering", () => {
    it("renders highlights with colored left border and quoted text", () => {
      const layer = makeLayer({
        color: "#ff0000",
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 10,
            text: "important phrase",
            annotation: "",
            type: "highlight",
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Genesis 1"]}
          sectionVisibility={[true]}
        />,
      );

      expect(screen.getByText("Highlights")).toBeInTheDocument();
      expect(container.textContent).toContain("important phrase");
      const borderEl = container.querySelector("[style]");
      expect(borderEl).toBeTruthy();
    });
  });

  describe("underlines rendering", () => {
    it("renders underlines with quoted text grouped by passage", () => {
      const layer = makeLayer({
        underlines: [
          {
            id: "u1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "underlined word",
            visible: true,
          },
          {
            id: "u2",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "another underline",
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Intro", "Body"]}
          sectionVisibility={[true, true]}
        />,
      );

      expect(screen.getByText("Underlines")).toBeInTheDocument();
      expect(container.textContent).toContain("underlined word");
      expect(container.textContent).toContain("another underline");
    });

    it("excludes underlines from hidden sections", () => {
      const layer = makeLayer({
        underlines: [
          {
            id: "u1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "visible underline",
            visible: true,
          },
          {
            id: "u2",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "hidden underline",
            visible: true,
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

      expect(container.textContent).toContain("visible underline");
      expect(container.textContent).not.toContain("hidden underline");
    });
  });

  describe("arrow connections rendering", () => {
    it("renders arrows as connections with from/to text and sections", () => {
      const layer = makeLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "source" },
            to: { editorIndex: 1, from: 0, to: 5, text: "target" },
            arrowStyle: "solid",
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Genesis", "Exodus"]}
          sectionVisibility={[true, true]}
        />,
      );

      expect(screen.getByText("Connections")).toBeInTheDocument();
      expect(container.textContent).toContain("source");
      expect(container.textContent).toContain("Genesis");
      expect(container.textContent).toContain("target");
      expect(container.textContent).toContain("Exodus");
    });

    it("shows arrow style when not solid", () => {
      const layer = makeLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "from" },
            to: { editorIndex: 0, from: 10, to: 15, text: "to" },
            arrowStyle: "dashed",
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );

      expect(container.textContent).toContain("[dashed]");
    });

    it("does not show style tag for solid arrows", () => {
      const layer = makeLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "from" },
            to: { editorIndex: 0, from: 10, to: 15, text: "to" },
            arrowStyle: "solid",
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );

      expect(container.textContent).not.toContain("[solid]");
    });

    it("excludes arrows when either section is hidden", () => {
      const layer = makeLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "visible from" },
            to: { editorIndex: 1, from: 0, to: 5, text: "hidden to" },
            arrowStyle: "solid",
            visible: true,
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

      expect(container.innerHTML).toBe("");
    });
  });

  describe("reply threads rendering", () => {
    it("renders replies indented under comments", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "commented text",
            annotation: "<p>main comment</p>",
            type: "comment",
            visible: true,
            replies: [
              {
                id: "r1",
                text: "I agree!",
                userName: "Alice",
                timestamp: new Date("2024-01-15").getTime(),
                reactions: [],
              },
              {
                id: "r2",
                text: "Great point",
                userName: "Bob",
                timestamp: new Date("2024-01-16").getTime(),
                reactions: [],
              },
            ],
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );

      expect(container.textContent).toContain("I agree!");
      expect(container.textContent).toContain("Alice");
      expect(container.textContent).toContain("Great point");
      expect(container.textContent).toContain("Bob");
    });
  });

  describe("mixed annotation types", () => {
    it("renders all annotation types together", () => {
      const layer = makeLayer({
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "comment text",
            annotation: "<p>a note</p>",
            type: "comment",
            visible: true,
          },
          {
            id: "h2",
            editorIndex: 0,
            from: 10,
            to: 15,
            text: "highlight text",
            annotation: "",
            type: "highlight",
            visible: true,
          },
        ],
        underlines: [
          {
            id: "u1",
            editorIndex: 0,
            from: 20,
            to: 25,
            text: "underline text",
            visible: true,
          },
        ],
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "arrow from" },
            to: { editorIndex: 0, from: 10, to: 15, text: "arrow to" },
            arrowStyle: "solid",
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );

      expect(screen.getByText("Comments")).toBeInTheDocument();
      expect(screen.getByText("Highlights")).toBeInTheDocument();
      expect(screen.getByText("Underlines")).toBeInTheDocument();
      expect(screen.getByText("Connections")).toBeInTheDocument();
      expect(container.textContent).toContain("comment text");
      expect(container.textContent).toContain("highlight text");
      expect(container.textContent).toContain("underline text");
      expect(container.textContent).toContain("arrow from");
    });
  });
});
