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
  describe("when no visible annotations exist", () => {
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

  describe("section-first grouping", () => {
    it("groups annotations by section with section headings appearing first", () => {
      const layer = makeLayer({
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
          {
            id: "h2",
            editorIndex: 1,
            from: 0,
            to: 5,
            text: "highlighted text",
            annotation: "",
            type: "highlight",
            visible: true,
          },
          {
            id: "h3",
            editorIndex: 0,
            from: 10,
            to: 15,
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
          sectionNames={["Intro", "Body"]}
          sectionVisibility={[true, true]}
        />,
      );

      // Section headings should appear
      const sectionHeadings = container.querySelectorAll(".print-section-heading");
      expect(sectionHeadings).toHaveLength(2);
      expect(sectionHeadings[0].textContent).toBe("Intro");
      expect(sectionHeadings[1].textContent).toBe("Body");

      // Under Intro, we should have Comments and Highlights sub-headings
      const textContent = container.textContent!;
      const introPos = textContent.indexOf("Intro");
      const bodyPos = textContent.indexOf("Body");
      const helloPos = textContent.indexOf("hello");
      const importantPos = textContent.indexOf("important phrase");
      const highlightedPos = textContent.indexOf("highlighted text");

      // "hello" and "important phrase" should appear between Intro and Body
      expect(helloPos).toBeGreaterThan(introPos);
      expect(helloPos).toBeLessThan(bodyPos);
      expect(importantPos).toBeGreaterThan(introPos);
      expect(importantPos).toBeLessThan(bodyPos);

      // "highlighted text" should appear after Body
      expect(highlightedPos).toBeGreaterThan(bodyPos);
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
    it("then groups annotations by section", () => {
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

      // Section names appear as section headings
      const sectionHeadings = document.querySelectorAll(".print-section-heading");
      expect(sectionHeadings.length).toBe(2);
      expect(sectionHeadings[0].textContent).toBe("Intro");
      expect(sectionHeadings[1].textContent).toBe("Body");
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
    it("renders underlines with quoted text grouped by section", () => {
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

      expect(screen.getAllByText("Underlines")).toHaveLength(2);
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
    it("renders arrows with numbered cross-references", () => {
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
      expect(container.textContent).toContain("[1]");
      expect(container.textContent).toContain("source");
      expect(container.textContent).toContain("target");
      expect(container.textContent).toContain("Exodus");
    });

    it("assigns sequential numbers [1], [2] to multiple arrows", () => {
      const layer = makeLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "first from" },
            to: { editorIndex: 1, from: 0, to: 5, text: "first to" },
            arrowStyle: "solid",
            visible: true,
          },
          {
            id: "a2",
            from: { editorIndex: 0, from: 10, to: 15, text: "second from" },
            to: { editorIndex: 1, from: 10, to: 15, text: "second to" },
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

      expect(container.textContent).toContain("[1]");
      expect(container.textContent).toContain("[2]");
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

  describe("cross-references summary", () => {
    it("renders a Cross-References section at the end when arrows exist", () => {
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

      render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Genesis", "Exodus"]}
          sectionVisibility={[true, true]}
        />,
      );

      expect(screen.getByText("Cross-References")).toBeInTheDocument();
    });

    it("lists all arrows with their numbers in the cross-references", () => {
      const layer = makeLayer({
        arrows: [
          {
            id: "a1",
            from: { editorIndex: 0, from: 0, to: 5, text: "alpha" },
            to: { editorIndex: 1, from: 0, to: 5, text: "beta" },
            arrowStyle: "solid",
            visible: true,
          },
          {
            id: "a2",
            from: { editorIndex: 1, from: 10, to: 15, text: "gamma" },
            to: { editorIndex: 0, from: 10, to: 15, text: "delta" },
            arrowStyle: "dashed",
            visible: true,
          },
        ],
      });

      render(
        <PrintAnnotations
          layers={[layer]}
          sectionNames={["Section A", "Section B"]}
          sectionVisibility={[true, true]}
        />,
      );

      const crossRefSection = screen.getByText("Cross-References").parentElement!;
      expect(crossRefSection.textContent).toContain("[1]");
      expect(crossRefSection.textContent).toContain("[2]");
      expect(crossRefSection.textContent).toContain("alpha");
      expect(crossRefSection.textContent).toContain("gamma");
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

  describe("layer color borders", () => {
    it("applies the layer color as border color to annotations", () => {
      const layer = makeLayer({
        color: "#ff0000",
        highlights: [
          {
            id: "h1",
            editorIndex: 0,
            from: 0,
            to: 5,
            text: "red bordered",
            annotation: "",
            type: "highlight",
            visible: true,
          },
        ],
      });

      const { container } = render(
        <PrintAnnotations layers={[layer]} sectionNames={["Text 1"]} sectionVisibility={[true]} />,
      );

      const borderEl = container.querySelector(".border-l-2");
      expect(borderEl).toBeTruthy();
      expect((borderEl as HTMLElement).style.borderColor).toBe("rgb(255, 0, 0)");
    });
  });
});
