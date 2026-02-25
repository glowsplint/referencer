import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFolders } from "./use-folders";
import type { FolderItem } from "@/lib/folder-client";

vi.mock("@/lib/folder-client", () => ({
  fetchFolders: vi.fn(),
  createFolder: vi.fn(),
  renameFolder: vi.fn(),
  deleteFolder: vi.fn(),
  toggleFolderFavorite: vi.fn(),
  moveFolderToFolder: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import {
  fetchFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  toggleFolderFavorite,
  moveFolderToFolder,
} from "@/lib/folder-client";
import { toast } from "sonner";

const mockFetchFolders = vi.mocked(fetchFolders);
const mockCreateFolder = vi.mocked(createFolder);
const mockRenameFolder = vi.mocked(renameFolder);
const mockDeleteFolder = vi.mocked(deleteFolder);
const mockToggleFav = vi.mocked(toggleFolderFavorite);
const mockMoveFolder = vi.mocked(moveFolderToFolder);

const folder1: FolderItem = {
  id: "f1",
  parentId: null,
  name: "Folder 1",
  isFavorite: false,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const folder2: FolderItem = {
  id: "f2",
  parentId: null,
  name: "Folder 2",
  isFavorite: false,
  createdAt: "2024-01-02",
  updatedAt: "2024-01-02",
};

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetchFolders.mockResolvedValue([folder1, folder2]);
});

describe("useFolders", () => {
  it("fetches folders on mount", async () => {
    const { result } = renderHook(() => useFolders());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.folders).toEqual([folder1, folder2]);
    expect(result.current.error).toBeNull();
  });

  it("sets error when fetch fails", async () => {
    mockFetchFolders.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe("Network error");
  });

  it("create adds folder optimistically", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockCreateFolder.mockResolvedValue(undefined);

    act(() => {
      result.current.create("f3", null, "Folder 3");
    });

    expect(result.current.folders).toHaveLength(3);
    const added = result.current.folders.find((f) => f.id === "f3");
    expect(added).toBeDefined();
    expect(added!.name).toBe("Folder 3");
    expect(added!.isFavorite).toBe(false);
  });

  it("create reverts on API failure", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockCreateFolder.mockRejectedValue(new Error("fail"));
    mockFetchFolders.mockResolvedValue([folder1, folder2]);

    act(() => {
      result.current.create("f3", null, "Folder 3");
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to create folder"));
    await waitFor(() => expect(result.current.folders).toHaveLength(2));
  });

  it("rename updates name optimistically", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockRenameFolder.mockResolvedValue(undefined);

    act(() => {
      result.current.rename("f1", "Renamed");
    });

    expect(result.current.folders[0].name).toBe("Renamed");
  });

  it("rename reverts on API failure", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockRenameFolder.mockRejectedValue(new Error("fail"));
    mockFetchFolders.mockResolvedValue([folder1, folder2]);

    act(() => {
      result.current.rename("f1", "Renamed");
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to rename folder"));
    await waitFor(() => expect(result.current.folders[0].name).toBe("Folder 1"));
  });

  it("remove filters folder optimistically", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDeleteFolder.mockResolvedValue(undefined);

    act(() => {
      result.current.remove("f1");
    });

    expect(result.current.folders).toHaveLength(1);
    expect(result.current.folders[0].id).toBe("f2");
  });

  it("remove reverts on failure with toast", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDeleteFolder.mockRejectedValue(new Error("fail"));
    mockFetchFolders.mockResolvedValue([folder1, folder2]);

    act(() => {
      result.current.remove("f1");
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to delete folder"));
    await waitFor(() => expect(result.current.folders).toHaveLength(2));
  });

  it("toggleFavorite updates isFavorite optimistically", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockToggleFav.mockResolvedValue(undefined);

    act(() => {
      result.current.toggleFavorite("f1", true);
    });

    expect(result.current.folders[0].isFavorite).toBe(true);
  });

  it("toggleFavorite reverts on failure", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockToggleFav.mockRejectedValue(new Error("fail"));
    mockFetchFolders.mockResolvedValue([folder1, folder2]);

    act(() => {
      result.current.toggleFavorite("f1", true);
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to update folder favorite"),
    );
    await waitFor(() => expect(result.current.folders[0].isFavorite).toBe(false));
  });

  it("moveFolder updates parentId optimistically", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockMoveFolder.mockResolvedValue(undefined);

    act(() => {
      result.current.moveFolder("f2", "f1");
    });

    expect(result.current.folders[1].parentId).toBe("f1");
  });

  it("moveFolder reverts on failure", async () => {
    const { result } = renderHook(() => useFolders());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockMoveFolder.mockRejectedValue(new Error("fail"));
    mockFetchFolders.mockResolvedValue([folder1, folder2]);

    act(() => {
      result.current.moveFolder("f2", "f1");
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to move folder"));
    await waitFor(() => expect(result.current.folders[1].parentId).toBeNull());
  });
});
