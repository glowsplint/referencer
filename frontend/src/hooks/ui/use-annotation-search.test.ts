import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useAnnotationSearch } from "./use-annotation-search";
import type { Layer, Highlight, Arrow, LayerUnderline, CommentReply } from "@/types/editor";

const makeHighlight = (overrides: Partial<Highlight> = {}): Highlight => ({
  id: "h1",
  editorIndex: 0,
  from: 0,
  to: 5,
  text: "hello",
  annotation: "my note",
  type: "highlight",
  visible: true,
  ...overrides,
});

const makeArrow = (overrides: Partial<Arrow> = {}): Arrow => ({
  id: "a1",
  from: { editorIndex: 0, from: 0, to: 3, text: "foo" },
  to: { editorIndex: 1, from: 0, to: 3, text: "bar" },
  visible: true,
  ...overrides,
});

const makeUnderline = (overrides: Partial<LayerUnderline> = {}): LayerUnderline => ({
  id: "u1",
  editorIndex: 0,
  from: 10,
  to: 20,
  text: "underlined text",
  visible: true,
  ...overrides,
});

const makeLayer = (overrides: Partial<Layer> = {}): Layer => ({
  id: "layer1",
  name: "Layer 1",
  color: "#ff0000",
  visible: true,
  highlights: [],
  arrows: [],
  underlines: [],
  ...overrides,
});

describe("useAnnotationSearch", () => {
  it("returns empty array for empty query", () => {
    const layers = [makeLayer({ highlights: [makeHighlight()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, ""));
    expect(result.current).toEqual([]);
  });

  it("returns empty array for short query (1 char)", () => {
    const layers = [makeLayer({ highlights: [makeHighlight()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "h"));
    expect(result.current).toEqual([]);
  });

  it("returns empty array for whitespace-only query", () => {
    const layers = [makeLayer({ highlights: [makeHighlight()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "   "));
    expect(result.current).toEqual([]);
  });

  it("finds highlights by text field", () => {
    const layers = [makeLayer({ highlights: [makeHighlight()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "hello"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].annotationId).toBe("h1");
    expect(result.current[0].annotationType).toBe("highlight");
  });

  it("finds highlights by annotation field", () => {
    const layers = [makeLayer({ highlights: [makeHighlight()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "my note"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].annotationId).toBe("h1");
  });

  it("finds comments (annotationType matches h.type when type is comment)", () => {
    const comment = makeHighlight({ id: "c1", type: "comment" });
    const layers = [makeLayer({ highlights: [comment] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "hello"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].annotationType).toBe("comment");
  });

  it("finds arrows by from.text", () => {
    const layers = [makeLayer({ arrows: [makeArrow()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "foo"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].annotationType).toBe("arrow");
    expect(result.current[0].annotationId).toBe("a1");
  });

  it("finds arrows by to.text", () => {
    const layers = [makeLayer({ arrows: [makeArrow()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "bar"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].annotationType).toBe("arrow");
  });

  it("finds underlines by text", () => {
    const layers = [makeLayer({ underlines: [makeUnderline()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "underlined"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].annotationType).toBe("underline");
    expect(result.current[0].annotationId).toBe("u1");
  });

  it("finds replies and match points to parent highlight position", () => {
    const reply: CommentReply = {
      id: "r1",
      text: "reply about grace",
      userName: "user",
      timestamp: 1,
      reactions: [],
    };
    const highlight = makeHighlight({
      id: "h-parent",
      from: 10,
      to: 20,
      text: "parent text",
      annotation: "parent annotation",
      replies: [reply],
    });
    const layers = [makeLayer({ highlights: [highlight] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "grace"));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].annotationId).toBe("h-parent");
    expect(result.current[0].from).toBe(10);
    expect(result.current[0].to).toBe(20);
    expect(result.current[0].displayText).toBe("parent annotation");
  });

  it("matches case-insensitively", () => {
    const layers = [makeLayer({ highlights: [makeHighlight({ text: "Hello World" })] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "HELLO WORLD"));
    expect(result.current).toHaveLength(1);
  });

  it("does not produce duplicates when both text and annotation match", () => {
    const highlight = makeHighlight({
      text: "grace abounds",
      annotation: "grace is mentioned here",
    });
    const layers = [makeLayer({ highlights: [highlight] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "grace"));
    expect(result.current).toHaveLength(1);
  });

  it("returns correct from, to, editorIndex per match type", () => {
    const highlight = makeHighlight({
      editorIndex: 2,
      from: 10,
      to: 15,
    });
    const arrow = makeArrow({
      id: "a2",
      from: { editorIndex: 1, from: 5, to: 8, text: "foo arrow" },
      to: { editorIndex: 3, from: 20, to: 25, text: "bar arrow" },
    });
    const underline = makeUnderline({
      id: "u2",
      editorIndex: 4,
      from: 30,
      to: 40,
    });
    const layers = [
      makeLayer({
        highlights: [highlight],
        arrows: [arrow],
        underlines: [underline],
      }),
    ];

    // Search for highlight
    const { result: r1 } = renderHook(() => useAnnotationSearch(layers, "hello"));
    expect(r1.current[0].editorIndex).toBe(2);
    expect(r1.current[0].from).toBe(10);
    expect(r1.current[0].to).toBe(15);

    // Search for arrow - uses a.from for position
    const { result: r2 } = renderHook(() => useAnnotationSearch(layers, "foo arrow"));
    expect(r2.current[0].editorIndex).toBe(1);
    expect(r2.current[0].from).toBe(5);
    expect(r2.current[0].to).toBe(8);

    // Search for underline
    const { result: r3 } = renderHook(() => useAnnotationSearch(layers, "underlined"));
    expect(r3.current[0].editorIndex).toBe(4);
    expect(r3.current[0].from).toBe(30);
    expect(r3.current[0].to).toBe(40);
  });

  it("displayText for highlights is annotation || text", () => {
    const withAnnotation = makeHighlight({
      id: "h-ann",
      text: "some text",
      annotation: "some annotation",
    });
    const withoutAnnotation = makeHighlight({
      id: "h-no-ann",
      text: "some text",
      annotation: "",
    });
    const layers = [makeLayer({ highlights: [withAnnotation, withoutAnnotation] })];

    const { result } = renderHook(() => useAnnotationSearch(layers, "some text"));
    const matchWithAnnotation = result.current.find((m) => m.annotationId === "h-ann");
    const matchWithoutAnnotation = result.current.find((m) => m.annotationId === "h-no-ann");

    expect(matchWithAnnotation?.displayText).toBe("some annotation");
    expect(matchWithoutAnnotation?.displayText).toBe("some text");
  });

  it("displayText for arrows is from.text + ' -> ' + to.text", () => {
    const layers = [makeLayer({ arrows: [makeArrow()] })];
    const { result } = renderHook(() => useAnnotationSearch(layers, "foo"));
    expect(result.current[0].displayText).toBe("foo -> bar");
  });
});
