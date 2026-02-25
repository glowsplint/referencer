import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useWorkspaces } from "./use-workspaces";
import type { WorkspaceItem } from "@/lib/workspace-client";

vi.mock("@/lib/workspace-client", () => ({
  fetchWorkspaces: vi.fn(),
  createWorkspace: vi.fn(),
  renameWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  duplicateWorkspace: vi.fn(),
  toggleFavorite: vi.fn(),
}));

vi.mock("@/lib/folder-client", () => ({
  moveWorkspaceToFolder: vi.fn(),
  unfileWorkspace: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import {
  fetchWorkspaces,
  createWorkspace,
  renameWorkspace,
  deleteWorkspace,
  duplicateWorkspace,
  toggleFavorite,
} from "@/lib/workspace-client";
import { moveWorkspaceToFolder, unfileWorkspace } from "@/lib/folder-client";
import { toast } from "sonner";

const mockFetch = vi.mocked(fetchWorkspaces);
const mockCreate = vi.mocked(createWorkspace);
const mockRename = vi.mocked(renameWorkspace);
const mockDelete = vi.mocked(deleteWorkspace);
const mockDuplicate = vi.mocked(duplicateWorkspace);
const mockToggleFav = vi.mocked(toggleFavorite);
const mockMoveToFolder = vi.mocked(moveWorkspaceToFolder);
const mockUnfile = vi.mocked(unfileWorkspace);

const ws1: WorkspaceItem = {
  workspaceId: "ws-1",
  title: "Workspace 1",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  isFavorite: false,
  folderId: null,
};

const ws2: WorkspaceItem = {
  workspaceId: "ws-2",
  title: "Workspace 2",
  createdAt: "2024-01-02",
  updatedAt: "2024-01-02",
  isFavorite: false,
  folderId: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockResolvedValue([ws1, ws2]);
});

describe("useWorkspaces", () => {
  it("fetches workspaces on mount", async () => {
    const { result } = renderHook(() => useWorkspaces());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.workspaces).toEqual([ws1, ws2]);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe("Network error");
  });

  it("rename updates title optimistically", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockRename.mockResolvedValue(undefined);

    act(() => {
      result.current.rename("ws-1", "New Title");
    });

    expect(result.current.workspaces[0].title).toBe("New Title");
    expect(mockRename).toHaveBeenCalledWith("ws-1", "New Title");
  });

  it("rename reverts on API failure", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockRename.mockRejectedValue(new Error("fail"));
    // silentRefetch returns original data
    mockFetch.mockResolvedValue([ws1, ws2]);

    act(() => {
      result.current.rename("ws-1", "New Title");
    });

    // Optimistic update applied immediately
    expect(result.current.workspaces[0].title).toBe("New Title");

    // Wait for refetch after failure
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to rename workspace"));
    await waitFor(() => expect(result.current.workspaces[0].title).toBe("Workspace 1"));
  });

  it("remove filters workspace optimistically", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDelete.mockResolvedValue(undefined);

    act(() => {
      result.current.remove("ws-1");
    });

    expect(result.current.workspaces).toHaveLength(1);
    expect(result.current.workspaces[0].workspaceId).toBe("ws-2");
  });

  it("remove reverts on failure with toast", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDelete.mockRejectedValue(new Error("fail"));
    mockFetch.mockResolvedValue([ws1, ws2]);

    act(() => {
      result.current.remove("ws-1");
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to delete workspace"));
    await waitFor(() => expect(result.current.workspaces).toHaveLength(2));
  });

  it("duplicate clones source workspace optimistically", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDuplicate.mockResolvedValue(undefined);

    act(() => {
      result.current.duplicate("ws-1", "ws-3");
    });

    expect(result.current.workspaces).toHaveLength(3);
    const duped = result.current.workspaces.find((w) => w.workspaceId === "ws-3");
    expect(duped).toBeDefined();
    expect(duped!.title).toBe("Workspace 1");
    expect(duped!.isFavorite).toBe(false);
  });

  it("toggleFavorite updates isFavorite optimistically", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockToggleFav.mockResolvedValue(undefined);

    act(() => {
      result.current.toggleFavorite("ws-1", true);
    });

    expect(result.current.workspaces[0].isFavorite).toBe(true);
  });

  it("moveToFolder updates folderId optimistically", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockMoveToFolder.mockResolvedValue(undefined);

    act(() => {
      result.current.moveToFolder("ws-1", "folder-1");
    });

    expect(result.current.workspaces[0].folderId).toBe("folder-1");
  });

  it("unfileWorkspace sets folderId to null optimistically", async () => {
    // Start with workspace in a folder
    mockFetch.mockResolvedValue([{ ...ws1, folderId: "folder-1" }, ws2]);
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockUnfile.mockResolvedValue(undefined);

    act(() => {
      result.current.unfileWorkspace("ws-1");
    });

    expect(result.current.workspaces[0].folderId).toBeNull();
  });

  it("create calls API and refetches", async () => {
    const { result } = renderHook(() => useWorkspaces());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockCreate.mockResolvedValue(undefined);
    const ws3: WorkspaceItem = {
      workspaceId: "ws-3",
      title: "New",
      createdAt: "2024-01-03",
      updatedAt: "2024-01-03",
      isFavorite: false,
      folderId: null,
    };
    mockFetch.mockResolvedValue([ws1, ws2, ws3]);

    await act(async () => {
      await result.current.create("ws-3", "New");
    });

    expect(mockCreate).toHaveBeenCalledWith("ws-3", "New");
    expect(result.current.workspaces).toHaveLength(3);
  });
});
