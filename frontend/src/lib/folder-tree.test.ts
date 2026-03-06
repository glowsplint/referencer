import { describe, it, expect } from "vitest";
import {
  buildFolderTree,
  getFolderDepth,
  getDocumentsForFolder,
  getUnfiledDocuments,
  getAllDescendantFolderIds,
  getSubtreeDepth,
  canMoveFolderTo,
  getFolderAncestorPath,
} from "./folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import type { DocumentItem } from "@/lib/document-client";

function makeFolder(overrides: Partial<FolderItem> & { id: string }): FolderItem {
  return {
    parentId: null,
    name: "Folder",
    isFavorite: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeDocument(overrides: Partial<DocumentItem> & { documentId: string }): DocumentItem {
  return {
    title: "Document",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    isFavorite: false,
    folderId: null,
    ...overrides,
  };
}

describe("when using buildFolderTree", () => {
  it("then returns empty array for empty input", () => {
    expect(buildFolderTree([])).toEqual([]);
  });

  it("then builds a flat list of root folders", () => {
    const folders = [
      makeFolder({ id: "f1", name: "Beta" }),
      makeFolder({ id: "f2", name: "Alpha" }),
    ];
    const tree = buildFolderTree(folders);
    expect(tree).toHaveLength(2);
    // sorted by name
    expect(tree[0].folder.name).toBe("Alpha");
    expect(tree[1].folder.name).toBe("Beta");
    expect(tree[0].depth).toBe(0);
    expect(tree[0].children).toEqual([]);
  });

  it("then builds a nested tree", () => {
    const folders = [
      makeFolder({ id: "f1", name: "Parent" }),
      makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
      makeFolder({ id: "f3", name: "Grandchild", parentId: "f2" }),
    ];
    const tree = buildFolderTree(folders);
    expect(tree).toHaveLength(1);
    expect(tree[0].folder.id).toBe("f1");
    expect(tree[0].depth).toBe(0);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].folder.id).toBe("f2");
    expect(tree[0].children[0].depth).toBe(1);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].folder.id).toBe("f3");
    expect(tree[0].children[0].children[0].depth).toBe(2);
  });

  it("then sorts children by name case-insensitively", () => {
    const folders = [
      makeFolder({ id: "f1", name: "Parent" }),
      makeFolder({ id: "f2", name: "zebra", parentId: "f1" }),
      makeFolder({ id: "f3", name: "Alpha", parentId: "f1" }),
    ];
    const tree = buildFolderTree(folders);
    expect(tree[0].children[0].folder.name).toBe("Alpha");
    expect(tree[0].children[1].folder.name).toBe("zebra");
  });
});

describe("when using getFolderDepth", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root" }),
    makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Grandchild", parentId: "f2" }),
  ];

  it("then returns 0 for a root folder", () => {
    expect(getFolderDepth(folders, "f1")).toBe(0);
  });

  it("then returns 1 for a direct child", () => {
    expect(getFolderDepth(folders, "f2")).toBe(1);
  });

  it("then returns 2 for a grandchild", () => {
    expect(getFolderDepth(folders, "f3")).toBe(2);
  });
});

describe("when using getDocumentsForFolder", () => {
  const documents = [
    makeDocument({ documentId: "ws-1", folderId: "f1" }),
    makeDocument({ documentId: "ws-2", folderId: "f2" }),
    makeDocument({ documentId: "ws-3", folderId: "f1" }),
    makeDocument({ documentId: "ws-4", folderId: null }),
  ];

  it("then returns documents matching the folder id", () => {
    const result = getDocumentsForFolder(documents, "f1");
    expect(result).toHaveLength(2);
    expect(result.map((ws) => ws.documentId)).toEqual(["ws-1", "ws-3"]);
  });

  it("then returns empty array when no documents match", () => {
    expect(getDocumentsForFolder(documents, "f99")).toEqual([]);
  });
});

describe("when using getUnfiledDocuments", () => {
  it("then excludes documents with a folderId", () => {
    const documents = [
      makeDocument({ documentId: "ws-1", folderId: "f1" }),
      makeDocument({ documentId: "ws-2", folderId: null }),
    ];
    const result = getUnfiledDocuments(documents);
    expect(result).toHaveLength(1);
    expect(result[0].documentId).toBe("ws-2");
  });

  it("then excludes favorited documents", () => {
    const documents = [
      makeDocument({ documentId: "ws-1", isFavorite: true }),
      makeDocument({ documentId: "ws-2", isFavorite: false }),
    ];
    const result = getUnfiledDocuments(documents);
    expect(result).toHaveLength(1);
    expect(result[0].documentId).toBe("ws-2");
  });

  it("then excludes both filed and favorited documents", () => {
    const documents = [
      makeDocument({ documentId: "ws-1", folderId: "f1", isFavorite: true }),
      makeDocument({ documentId: "ws-2", folderId: "f1" }),
      makeDocument({ documentId: "ws-3", isFavorite: true }),
      makeDocument({ documentId: "ws-4" }),
    ];
    const result = getUnfiledDocuments(documents);
    expect(result).toHaveLength(1);
    expect(result[0].documentId).toBe("ws-4");
  });

  it("then returns empty array when all documents are filed or favorited", () => {
    const documents = [
      makeDocument({ documentId: "ws-1", folderId: "f1" }),
      makeDocument({ documentId: "ws-2", isFavorite: true }),
    ];
    expect(getUnfiledDocuments(documents)).toEqual([]);
  });
});

describe("when using getAllDescendantFolderIds", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root" }),
    makeFolder({ id: "f2", name: "Child A", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Child B", parentId: "f1" }),
    makeFolder({ id: "f4", name: "Grandchild", parentId: "f2" }),
  ];

  it("then returns all descendants for a folder with children", () => {
    const ids = getAllDescendantFolderIds(folders, "f1");
    expect(ids).toHaveLength(3);
    expect(ids).toContain("f2");
    expect(ids).toContain("f3");
    expect(ids).toContain("f4");
  });

  it("then returns only direct children when no grandchildren", () => {
    const ids = getAllDescendantFolderIds(folders, "f3");
    expect(ids).toEqual([]);
  });

  it("then returns grandchild for intermediate folder", () => {
    const ids = getAllDescendantFolderIds(folders, "f2");
    expect(ids).toEqual(["f4"]);
  });

  it("then returns empty array for a leaf folder", () => {
    expect(getAllDescendantFolderIds(folders, "f4")).toEqual([]);
  });

  it("then returns empty array for nonexistent folder", () => {
    expect(getAllDescendantFolderIds(folders, "f99")).toEqual([]);
  });
});

describe("when using getSubtreeDepth", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root" }),
    makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Grandchild", parentId: "f2" }),
  ];

  it("then returns 0 for a leaf folder with no children", () => {
    expect(getSubtreeDepth(folders, "f3")).toBe(0);
  });

  it("then returns 1 for a folder with only direct children", () => {
    expect(getSubtreeDepth(folders, "f2")).toBe(1);
  });

  it("then returns 2 for a folder with grandchildren", () => {
    expect(getSubtreeDepth(folders, "f1")).toBe(2);
  });

  it("then returns 0 for nonexistent folder", () => {
    expect(getSubtreeDepth(folders, "f99")).toBe(0);
  });
});

describe("when using canMoveFolderTo", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root A" }),
    makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Root B" }),
  ];

  it("then returns false when moving to self", () => {
    expect(canMoveFolderTo(folders, "f1", "f1")).toBe(false);
  });

  it("then returns true when moving to root (null parent)", () => {
    expect(canMoveFolderTo(folders, "f2", null)).toBe(true);
  });

  it("then returns false when moving to own descendant", () => {
    expect(canMoveFolderTo(folders, "f1", "f2")).toBe(false);
  });

  it("then returns true when moving to a sibling root folder", () => {
    expect(canMoveFolderTo(folders, "f1", "f3")).toBe(true);
  });

  it("then returns true when moving a leaf to another root folder", () => {
    expect(canMoveFolderTo(folders, "f2", "f3")).toBe(true);
  });

  it("then returns false when resulting depth exceeds max (10)", () => {
    // Build a chain: f0 -> f1 -> ... -> f8 (subtree depth of f0 = 8)
    // Target parent at depth 2 => 2 + 1 + 8 = 11 > 10
    const deepFolders: FolderItem[] = [];
    for (let i = 0; i <= 8; i++) {
      deepFolders.push(
        makeFolder({
          id: `f${i}`,
          name: `Level ${i}`,
          parentId: i === 0 ? null : `f${i - 1}`,
        }),
      );
    }
    // Add a separate chain: p0 -> p1 -> p2
    deepFolders.push(makeFolder({ id: "p0", name: "Parent Root" }));
    deepFolders.push(makeFolder({ id: "p1", name: "Parent Child", parentId: "p0" }));
    deepFolders.push(makeFolder({ id: "p2", name: "Parent Grandchild", parentId: "p1" }));
    // Moving f0 (subtree depth 8) under p2 (depth 2) => 2 + 1 + 8 = 11 > 10
    expect(canMoveFolderTo(deepFolders, "f0", "p2")).toBe(false);
  });

  it("then returns true when resulting depth is exactly at the limit", () => {
    // Build a chain of 10 levels: f0 -> f1 -> ... -> f9 (depth 9)
    // f10 (leaf, subtree depth 0) moved under f9 (depth 9) => 9 + 1 + 0 = 10 <= 10
    const limitFolders: FolderItem[] = [];
    for (let i = 0; i <= 9; i++) {
      limitFolders.push(
        makeFolder({
          id: `f${i}`,
          name: `Level ${i}`,
          parentId: i === 0 ? null : `f${i - 1}`,
        }),
      );
    }
    limitFolders.push(makeFolder({ id: "f10", name: "Leaf" }));
    expect(canMoveFolderTo(limitFolders, "f10", "f9")).toBe(true);
  });
});

describe("when using getFolderAncestorPath", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root" }),
    makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Grandchild", parentId: "f2" }),
  ];

  it("then returns the full path from root to the given folder", () => {
    const path = getFolderAncestorPath(folders, "f3");
    expect(path).toHaveLength(3);
    expect(path[0].id).toBe("f1");
    expect(path[1].id).toBe("f2");
    expect(path[2].id).toBe("f3");
  });

  it("then returns a single element for a root folder", () => {
    const path = getFolderAncestorPath(folders, "f1");
    expect(path).toHaveLength(1);
    expect(path[0].id).toBe("f1");
  });

  it("then returns empty array for nonexistent folder", () => {
    expect(getFolderAncestorPath(folders, "f99")).toEqual([]);
  });
});
