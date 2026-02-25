import { describe, it, expect } from "vitest";
import {
  buildFolderTree,
  getFolderDepth,
  getWorkspacesForFolder,
  getUnfiledWorkspaces,
  getAllDescendantFolderIds,
  getSubtreeDepth,
  canMoveFolderTo,
} from "./folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import type { WorkspaceItem } from "@/lib/workspace-client";

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

function makeWorkspace(overrides: Partial<WorkspaceItem> & { workspaceId: string }): WorkspaceItem {
  return {
    title: "Workspace",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    isFavorite: false,
    folderId: null,
    ...overrides,
  };
}

describe("buildFolderTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildFolderTree([])).toEqual([]);
  });

  it("builds a flat list of root folders", () => {
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

  it("builds a nested tree", () => {
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

  it("sorts children by name case-insensitively", () => {
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

describe("getFolderDepth", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root" }),
    makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Grandchild", parentId: "f2" }),
  ];

  it("returns 0 for a root folder", () => {
    expect(getFolderDepth(folders, "f1")).toBe(0);
  });

  it("returns 1 for a direct child", () => {
    expect(getFolderDepth(folders, "f2")).toBe(1);
  });

  it("returns 2 for a grandchild", () => {
    expect(getFolderDepth(folders, "f3")).toBe(2);
  });
});

describe("getWorkspacesForFolder", () => {
  const workspaces = [
    makeWorkspace({ workspaceId: "ws-1", folderId: "f1" }),
    makeWorkspace({ workspaceId: "ws-2", folderId: "f2" }),
    makeWorkspace({ workspaceId: "ws-3", folderId: "f1" }),
    makeWorkspace({ workspaceId: "ws-4", folderId: null }),
  ];

  it("returns workspaces matching the folder id", () => {
    const result = getWorkspacesForFolder(workspaces, "f1");
    expect(result).toHaveLength(2);
    expect(result.map((ws) => ws.workspaceId)).toEqual(["ws-1", "ws-3"]);
  });

  it("returns empty array when no workspaces match", () => {
    expect(getWorkspacesForFolder(workspaces, "f99")).toEqual([]);
  });
});

describe("getUnfiledWorkspaces", () => {
  it("excludes workspaces with a folderId", () => {
    const workspaces = [
      makeWorkspace({ workspaceId: "ws-1", folderId: "f1" }),
      makeWorkspace({ workspaceId: "ws-2", folderId: null }),
    ];
    const result = getUnfiledWorkspaces(workspaces);
    expect(result).toHaveLength(1);
    expect(result[0].workspaceId).toBe("ws-2");
  });

  it("excludes favorited workspaces", () => {
    const workspaces = [
      makeWorkspace({ workspaceId: "ws-1", isFavorite: true }),
      makeWorkspace({ workspaceId: "ws-2", isFavorite: false }),
    ];
    const result = getUnfiledWorkspaces(workspaces);
    expect(result).toHaveLength(1);
    expect(result[0].workspaceId).toBe("ws-2");
  });

  it("excludes both filed and favorited workspaces", () => {
    const workspaces = [
      makeWorkspace({ workspaceId: "ws-1", folderId: "f1", isFavorite: true }),
      makeWorkspace({ workspaceId: "ws-2", folderId: "f1" }),
      makeWorkspace({ workspaceId: "ws-3", isFavorite: true }),
      makeWorkspace({ workspaceId: "ws-4" }),
    ];
    const result = getUnfiledWorkspaces(workspaces);
    expect(result).toHaveLength(1);
    expect(result[0].workspaceId).toBe("ws-4");
  });

  it("returns empty array when all workspaces are filed or favorited", () => {
    const workspaces = [
      makeWorkspace({ workspaceId: "ws-1", folderId: "f1" }),
      makeWorkspace({ workspaceId: "ws-2", isFavorite: true }),
    ];
    expect(getUnfiledWorkspaces(workspaces)).toEqual([]);
  });
});

describe("getAllDescendantFolderIds", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root" }),
    makeFolder({ id: "f2", name: "Child A", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Child B", parentId: "f1" }),
    makeFolder({ id: "f4", name: "Grandchild", parentId: "f2" }),
  ];

  it("returns all descendants for a folder with children", () => {
    const ids = getAllDescendantFolderIds(folders, "f1");
    expect(ids).toHaveLength(3);
    expect(ids).toContain("f2");
    expect(ids).toContain("f3");
    expect(ids).toContain("f4");
  });

  it("returns only direct children when no grandchildren", () => {
    const ids = getAllDescendantFolderIds(folders, "f3");
    expect(ids).toEqual([]);
  });

  it("returns grandchild for intermediate folder", () => {
    const ids = getAllDescendantFolderIds(folders, "f2");
    expect(ids).toEqual(["f4"]);
  });

  it("returns empty array for a leaf folder", () => {
    expect(getAllDescendantFolderIds(folders, "f4")).toEqual([]);
  });

  it("returns empty array for nonexistent folder", () => {
    expect(getAllDescendantFolderIds(folders, "f99")).toEqual([]);
  });
});

describe("getSubtreeDepth", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root" }),
    makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Grandchild", parentId: "f2" }),
  ];

  it("returns 0 for a leaf folder with no children", () => {
    expect(getSubtreeDepth(folders, "f3")).toBe(0);
  });

  it("returns 1 for a folder with only direct children", () => {
    expect(getSubtreeDepth(folders, "f2")).toBe(1);
  });

  it("returns 2 for a folder with grandchildren", () => {
    expect(getSubtreeDepth(folders, "f1")).toBe(2);
  });

  it("returns 0 for nonexistent folder", () => {
    expect(getSubtreeDepth(folders, "f99")).toBe(0);
  });
});

describe("canMoveFolderTo", () => {
  const folders = [
    makeFolder({ id: "f1", name: "Root A" }),
    makeFolder({ id: "f2", name: "Child", parentId: "f1" }),
    makeFolder({ id: "f3", name: "Root B" }),
  ];

  it("returns false when moving to self", () => {
    expect(canMoveFolderTo(folders, "f1", "f1")).toBe(false);
  });

  it("returns true when moving to root (null parent)", () => {
    expect(canMoveFolderTo(folders, "f2", null)).toBe(true);
  });

  it("returns false when moving to own descendant", () => {
    expect(canMoveFolderTo(folders, "f1", "f2")).toBe(false);
  });

  it("returns true when moving to a sibling root folder", () => {
    expect(canMoveFolderTo(folders, "f1", "f3")).toBe(true);
  });

  it("returns true when moving a leaf to another root folder", () => {
    expect(canMoveFolderTo(folders, "f2", "f3")).toBe(true);
  });

  it("returns false when resulting depth exceeds max (3)", () => {
    // Build a deep tree: f10 -> f11 -> f12 (subtree depth of f10 = 2)
    // Target parent at depth 1 => 1 + 1 + 2 = 4 > 3
    const deepFolders = [
      makeFolder({ id: "f10", name: "Deep Root" }),
      makeFolder({ id: "f11", name: "Deep Child", parentId: "f10" }),
      makeFolder({ id: "f12", name: "Deep Grandchild", parentId: "f11" }),
      makeFolder({ id: "f20", name: "Other Root" }),
      makeFolder({ id: "f21", name: "Other Child", parentId: "f20" }),
    ];
    // Moving f10 (subtree depth 2) under f21 (depth 1) => 1 + 1 + 2 = 4 > 3
    expect(canMoveFolderTo(deepFolders, "f10", "f21")).toBe(false);
  });

  it("returns true when resulting depth is exactly at the limit", () => {
    // f10 has subtree depth 0, parent at depth 2 => 2 + 1 + 0 = 3 <= 3
    const limitFolders = [
      makeFolder({ id: "f10", name: "Leaf" }),
      makeFolder({ id: "f20", name: "Root" }),
      makeFolder({ id: "f21", name: "Child", parentId: "f20" }),
      makeFolder({ id: "f22", name: "Grandchild", parentId: "f21" }),
    ];
    expect(canMoveFolderTo(limitFolders, "f10", "f22")).toBe(true);
  });
});
