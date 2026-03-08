import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithDocument } from "@/test/render-with-document";
import { HubSearchResults } from "./HubSearchResults";
import type { SearchResult } from "@/lib/search-client";

const makeResult = (overrides: Partial<SearchResult> = {}): SearchResult => ({
  annotation_id: "ann-1",
  document_id: "doc-1",
  document_title: "Test Document",
  layer_id: "layer-1",
  layer_name: "Layer 1",
  annotation_type: "highlight",
  selected_text: "hello world",
  annotation_text: "",
  reply_texts: "",
  user_name: "User",
  rank: 1,
  ...overrides,
});

describe("HubSearchResults", () => {
  it("renders results grouped by document", () => {
    const results = [
      makeResult({ annotation_id: "a1", document_id: "d1", document_title: "Doc A" }),
      makeResult({ annotation_id: "a2", document_id: "d1", document_title: "Doc A" }),
      makeResult({ annotation_id: "a3", document_id: "d2", document_title: "Doc B" }),
    ];
    const navigate = vi.fn();

    renderWithDocument(
      <HubSearchResults
        results={results}
        total={3}
        query="hello"
        isLoading={false}
        error={null}
        navigate={navigate}
      />,
    );

    expect(screen.getByTestId("hubSearchResults")).toBeInTheDocument();
    expect(screen.getByText("Doc A")).toBeInTheDocument();
    expect(screen.getByText("Doc B")).toBeInTheDocument();
    expect(screen.getByTestId("hubSearchResult-a1")).toBeInTheDocument();
    expect(screen.getByTestId("hubSearchResult-a2")).toBeInTheDocument();
    expect(screen.getByTestId("hubSearchResult-a3")).toBeInTheDocument();
  });

  it("navigates to document on click", () => {
    const navigate = vi.fn();
    const results = [makeResult({ annotation_id: "a1", document_id: "d1" })];

    renderWithDocument(
      <HubSearchResults
        results={results}
        total={1}
        query="hello"
        isLoading={false}
        error={null}
        navigate={navigate}
      />,
    );

    fireEvent.click(screen.getByTestId("hubSearchResult-a1"));
    expect(navigate).toHaveBeenCalledWith("#/d1");
  });

  it("shows loading state", () => {
    const navigate = vi.fn();

    renderWithDocument(
      <HubSearchResults
        results={[]}
        total={0}
        query="hello"
        isLoading={true}
        error={null}
        navigate={navigate}
      />,
    );

    expect(screen.getByTestId("hubSearchLoading")).toBeInTheDocument();
  });

  it("shows empty state when no results", () => {
    const navigate = vi.fn();

    renderWithDocument(
      <HubSearchResults
        results={[]}
        total={0}
        query="hello"
        isLoading={false}
        error={null}
        navigate={navigate}
      />,
    );

    expect(screen.getByTestId("hubSearchEmpty")).toBeInTheDocument();
  });

  it("renders nothing on error", () => {
    const navigate = vi.fn();

    const { container } = renderWithDocument(
      <HubSearchResults
        results={[]}
        total={0}
        query="hello"
        isLoading={false}
        error={new Error("fail")}
        navigate={navigate}
      />,
    );

    expect(container.innerHTML).toBe("");
  });
});
