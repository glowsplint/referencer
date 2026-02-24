import { describe, it, expect } from "vitest";
import {
  buildFolderTree,
  getFolderDepth,
  getWorkspacesForFolder,
  getUnfiledWorkspaces,
} from "./folder-tree";
import type { FolderItem } from "@/lib/folder-client";
import type { WorkspaceItem } from "@/lib/workspace-client";

function makeFolder(overrides: Partial<FolderItem> & { id: string }): FolderItem {
  return {
    parentId: null,
    name: "Folder",
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
