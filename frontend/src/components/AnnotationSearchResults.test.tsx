import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnnotationSearchResults } from "./AnnotationSearchResults";
import { renderWithDocument } from "@/test/render-with-document";
import type { AnnotationSearchMatch } from "@/types/editor";

const matches: AnnotationSearchMatch[] = [
  {
    layerId: "l1",
    layerName: "Observations",
    layerColor: "#ff0000",
    annotationType: "highlight",
    annotationId: "h1",
    displayText: "important word",
    editorIndex: 0,
    from: 0,
    to: 5,
  },
  {
    layerId: "l1",
    layerName: "Observations",
    layerColor: "#ff0000",
    annotationType: "comment",
    annotationId: "h2",
    displayText: "comment about grace",
    editorIndex: 0,
    from: 10,
    to: 20,
  },
  {
    layerId: "l2",
    layerName: "Connections",
    layerColor: "#0000ff",
    annotationType: "arrow",
    annotationId: "a1",
    displayText: "word -> related",
    editorIndex: 0,
    from: 0,
    to: 5,
  },
];

describe("AnnotationSearchResults", () => {
  it("renders grouped results with layer names", () => {
    renderWithDocument(
      <AnnotationSearchResults matches={matches} query="word" onResultClick={vi.fn()} />,
    );
    expect(screen.getByText("Observations")).toBeInTheDocument();
    expect(screen.getByText("Connections")).toBeInTheDocument();
  });

  it("shows color swatches for each layer group", () => {
    const { container } = renderWithDocument(
      <AnnotationSearchResults matches={matches} query="word" onResultClick={vi.fn()} />,
    );
    const swatches = container.querySelectorAll(".rounded-full");
    expect(swatches.length).toBeGreaterThanOrEqual(2);
  });

  it('shows "No matching annotations" for empty matches array', () => {
    renderWithDocument(
      <AnnotationSearchResults matches={[]} query="xyz" onResultClick={vi.fn()} />,
    );
    expect(screen.getByText("No matching annotations")).toBeInTheDocument();
  });

  it("calls onResultClick with correct match on click", () => {
    const onClick = vi.fn();
    renderWithDocument(
      <AnnotationSearchResults matches={matches} query="word" onResultClick={onClick} />,
    );
    fireEvent.click(screen.getByTestId("searchResult-h1"));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledWith(matches[0]);
  });

  it("shows result count", () => {
    renderWithDocument(
      <AnnotationSearchResults matches={matches} query="word" onResultClick={vi.fn()} />,
    );
    expect(screen.getByText(/result/i)).toBeInTheDocument();
  });

  it("each result has correct data-testid", () => {
    renderWithDocument(
      <AnnotationSearchResults matches={matches} query="word" onResultClick={vi.fn()} />,
    );
    expect(screen.getByTestId("searchResult-h1")).toBeInTheDocument();
    expect(screen.getByTestId("searchResult-h2")).toBeInTheDocument();
    expect(screen.getByTestId("searchResult-a1")).toBeInTheDocument();
  });
});
