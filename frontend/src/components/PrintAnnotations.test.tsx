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
  it("renders nothing when no visible comments exist", () => {
    const { container } = render(
      <PrintAnnotations
        layers={[makeLayer()]}
        sectionNames={["Passage 1"]}
        sectionVisibility={[true]}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when layer is hidden", () => {
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
      <PrintAnnotations layers={[layer]} sectionNames={["Passage 1"]} sectionVisibility={[true]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing for highlight type highlights (not comments)", () => {
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
      <PrintAnnotations layers={[layer]} sectionNames={["Passage 1"]} sectionVisibility={[true]} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders comments grouped by passage", () => {
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

  it("renders quoted text and annotation", () => {
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
      <PrintAnnotations layers={[layer]} sectionNames={["Passage 1"]} sectionVisibility={[true]} />,
    );

    // Quoted text uses &ldquo; and &rdquo; so check for the text content
    expect(container.textContent).toContain("selected text");
    expect(container.textContent).toContain("my comment");
  });

  it("renders layer color as border-left", () => {
    const layer = makeLayer({
      color: "#86efac",
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
      <PrintAnnotations layers={[layer]} sectionNames={["Passage 1"]} sectionVisibility={[true]} />,
    );

    const borderEl = container.querySelector(".border-l-2") as HTMLElement;
    expect(borderEl).toBeTruthy();
    expect(borderEl.style.borderColor).toBe("rgb(134, 239, 172)");
  });

  it("excludes comments from hidden sections", () => {
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

  it("migrates plain text annotations to HTML", () => {
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
      <PrintAnnotations layers={[layer]} sectionNames={["Passage 1"]} sectionVisibility={[true]} />,
    );

    // migrateAnnotation wraps plain text in <p> tags
    const proseEl = container.querySelector(".prose-xs");
    expect(proseEl?.innerHTML).toContain("<p>plain text note</p>");
  });
});
