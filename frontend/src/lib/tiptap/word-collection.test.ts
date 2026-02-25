import { describe, it, expect } from "vitest";
import { collectAllWords } from "./word-collection";

function mockEditor(blocks: string[]) {
  const children: { isTextblock: boolean; textContent: string }[] = blocks.map((text) => ({
    isTextblock: true,
    textContent: text,
  }));

  // Simulate ProseMirror positions: each block has opening token (1 char)
  // and content length, plus closing token
  const doc = {
    descendants(callback: (node: any, pos: number) => boolean | void) {
      let pos = 0;
      for (const child of children) {
        callback(child, pos);
        // pos + 1 (opening) + textContent.length + 1 (closing)
        pos += 1 + child.textContent.length + 1;
      }
    },
  };

  return { state: { doc } } as any;
}

describe("when using collectAllWords", () => {
  it("then extracts words from a single paragraph", () => {
    const editor = mockEditor(["hello world"]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "hello" },
      { editorIndex: 0, from: 7, to: 12, text: "world" },
    ]);
  });

  it("then extracts words from multiple paragraphs", () => {
    const editor = mockEditor(["foo", "bar baz"]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 4, text: "foo" },
      { editorIndex: 0, from: 6, to: 9, text: "bar" },
      { editorIndex: 0, from: 10, to: 13, text: "baz" },
    ]);
  });

  it("then returns empty array for empty doc", () => {
    const editor = mockEditor([]);
    expect(collectAllWords(editor, 0)).toEqual([]);
  });

  it("then skips non-word punctuation characters", () => {
    const editor = mockEditor(["hello, world!"]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "hello" },
      { editorIndex: 0, from: 8, to: 13, text: "world" },
    ]);
  });

  it("then includes apostrophes as part of words", () => {
    const editor = mockEditor(["don't stop"]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "don't" },
      { editorIndex: 0, from: 7, to: 11, text: "stop" },
    ]);
  });

  it("then includes hyphens as part of words", () => {
    const editor = mockEditor(["well-known fact"]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 11, text: "well-known" },
      { editorIndex: 0, from: 12, to: 16, text: "fact" },
    ]);
  });

  it("then includes numbers as words", () => {
    const editor = mockEditor(["test123 456"]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 8, text: "test123" },
      { editorIndex: 0, from: 9, to: 12, text: "456" },
    ]);
  });

  it("then does not match standalone hyphens or apostrophes", () => {
    const editor = mockEditor(["hello - world ' foo"]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "hello" },
      { editorIndex: 0, from: 9, to: 14, text: "world" },
      { editorIndex: 0, from: 17, to: 20, text: "foo" },
    ]);
  });

  it("then uses the provided editorIndex", () => {
    const editor = mockEditor(["hi"]);
    const words = collectAllWords(editor, 2);

    expect(words).toEqual([{ editorIndex: 2, from: 1, to: 3, text: "hi" }]);
  });
});

type MockNode = {
  isTextblock: boolean;
  textContent: string;
  type: { name: string };
  attrs?: Record<string, unknown>;
  nodeSize: number;
};

function mockEditorWithNodes(nodes: MockNode[]) {
  const doc = {
    descendants(callback: (node: any, pos: number) => boolean | void) {
      let pos = 0;
      for (const node of nodes) {
        callback(node, pos);
        pos += node.nodeSize;
      }
    },
  };
  return { state: { doc } } as any;
}

function textBlock(text: string): MockNode {
  return {
    isTextblock: true,
    textContent: text,
    type: { name: "paragraph" },
    nodeSize: 1 + text.length + 1,
  };
}

function imageNode(alt: string): MockNode {
  return {
    isTextblock: false,
    textContent: "",
    type: { name: "image" },
    attrs: { alt },
    nodeSize: 1,
  };
}

describe("when using collectAllWords with images", () => {
  it("then collects image alt text as a word with isImage flag", () => {
    const editor = mockEditorWithNodes([imageNode("placeholder-image")]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 0, to: 1, text: "placeholder-image", isImage: true },
    ]);
  });

  it("then collects image words alongside text words with correct positions", () => {
    const editor = mockEditorWithNodes([
      textBlock("hello world"), // pos 0, size 13
      imageNode("placeholder-image"), // pos 13, size 1
      textBlock("next line"), // pos 14, size 11
    ]);
    const words = collectAllWords(editor, 0);

    expect(words).toEqual([
      { editorIndex: 0, from: 1, to: 6, text: "hello" },
      { editorIndex: 0, from: 7, to: 12, text: "world" },
      { editorIndex: 0, from: 13, to: 14, text: "placeholder-image", isImage: true },
      { editorIndex: 0, from: 15, to: 19, text: "next" },
      { editorIndex: 0, from: 20, to: 24, text: "line" },
    ]);
  });

  it("then skips images without alt text", () => {
    const noAlt: MockNode = {
      isTextblock: false,
      textContent: "",
      type: { name: "image" },
      attrs: {},
      nodeSize: 1,
    };
    const editor = mockEditorWithNodes([noAlt]);
    expect(collectAllWords(editor, 0)).toEqual([]);
  });

  it("then skips images with non-alphanumeric alt text", () => {
    const editor = mockEditorWithNodes([imageNode("---")]);
    expect(collectAllWords(editor, 0)).toEqual([]);
  });
});
