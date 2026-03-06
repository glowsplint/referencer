import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDocuments } from "./use-documents";
import type { DocumentItem } from "@/lib/document-client";

vi.mock("@/lib/document-client", () => ({
  fetchDocuments: vi.fn(),
  createDocument: vi.fn(),
  renameDocument: vi.fn(),
  deleteDocument: vi.fn(),
  duplicateDocument: vi.fn(),
  toggleFavorite: vi.fn(),
}));

vi.mock("@/lib/folder-client", () => ({
  moveDocumentToFolder: vi.fn(),
  unfileDocument: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import {
  fetchDocuments,
  createDocument,
  renameDocument,
  deleteDocument,
  duplicateDocument,
  toggleFavorite,
} from "@/lib/document-client";
import { moveDocumentToFolder, unfileDocument } from "@/lib/folder-client";
import { toast } from "sonner";

const mockFetch = vi.mocked(fetchDocuments);
const mockCreate = vi.mocked(createDocument);
const mockRename = vi.mocked(renameDocument);
const mockDelete = vi.mocked(deleteDocument);
const mockDuplicate = vi.mocked(duplicateDocument);
const mockToggleFav = vi.mocked(toggleFavorite);
const mockMoveToFolder = vi.mocked(moveDocumentToFolder);
const mockUnfile = vi.mocked(unfileDocument);

const ws1: DocumentItem = {
  documentId: "ws-1",
  title: "Document 1",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  isFavorite: false,
  folderId: null,
};

const ws2: DocumentItem = {
  documentId: "ws-2",
  title: "Document 2",
  createdAt: "2024-01-02",
  updatedAt: "2024-01-02",
  isFavorite: false,
  folderId: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockResolvedValue([ws1, ws2]);
});

describe("useDocuments", () => {
  it("when mounted, then fetches documents", async () => {
    const { result } = renderHook(() => useDocuments());
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.documents).toEqual([ws1, ws2]);
    expect(result.current.error).toBeNull();
  });

  it("when fetch fails, then sets error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error?.message).toBe("Network error");
  });

  it("when rename is called, then updates title optimistically", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockRename.mockResolvedValue(undefined);

    act(() => {
      result.current.rename("ws-1", "New Title");
    });

    expect(result.current.documents[0].title).toBe("New Title");
    expect(mockRename).toHaveBeenCalledWith("ws-1", "New Title");
  });

  it("when rename API call fails, then reverts the title", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockRename.mockRejectedValue(new Error("fail"));
    // silentRefetch returns original data
    mockFetch.mockResolvedValue([ws1, ws2]);

    act(() => {
      result.current.rename("ws-1", "New Title");
    });

    // Optimistic update applied immediately
    expect(result.current.documents[0].title).toBe("New Title");

    // Wait for refetch after failure
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to rename document"));
    await waitFor(() => expect(result.current.documents[0].title).toBe("Document 1"));
  });

  it("when remove is called, then filters document optimistically", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDelete.mockResolvedValue(undefined);

    act(() => {
      result.current.remove("ws-1");
    });

    expect(result.current.documents).toHaveLength(1);
    expect(result.current.documents[0].documentId).toBe("ws-2");
  });

  it("when remove API call fails, then reverts and shows toast", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDelete.mockRejectedValue(new Error("fail"));
    mockFetch.mockResolvedValue([ws1, ws2]);

    act(() => {
      result.current.remove("ws-1");
    });

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Failed to delete document"));
    await waitFor(() => expect(result.current.documents).toHaveLength(2));
  });

  it("when duplicate is called, then clones source document optimistically", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockDuplicate.mockResolvedValue(undefined);

    act(() => {
      result.current.duplicate("ws-1", "ws-3");
    });

    expect(result.current.documents).toHaveLength(3);
    const duped = result.current.documents.find((w) => w.documentId === "ws-3");
    expect(duped).toBeDefined();
    expect(duped!.title).toBe("Document 1");
    expect(duped!.isFavorite).toBe(false);
  });

  it("when toggleFavorite is called, then updates isFavorite optimistically", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockToggleFav.mockResolvedValue(undefined);

    act(() => {
      result.current.toggleFavorite("ws-1", true);
    });

    expect(result.current.documents[0].isFavorite).toBe(true);
  });

  it("when moveToFolder is called, then updates folderId optimistically", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockMoveToFolder.mockResolvedValue(undefined);

    act(() => {
      result.current.moveToFolder("ws-1", "folder-1");
    });

    expect(result.current.documents[0].folderId).toBe("folder-1");
  });

  it("when unfileDocument is called, then sets folderId to null optimistically", async () => {
    // Start with document in a folder
    mockFetch.mockResolvedValue([{ ...ws1, folderId: "folder-1" }, ws2]);
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockUnfile.mockResolvedValue(undefined);

    act(() => {
      result.current.unfileDocument("ws-1");
    });

    expect(result.current.documents[0].folderId).toBeNull();
  });

  it("when create is called, then calls API and refetches", async () => {
    const { result } = renderHook(() => useDocuments());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    mockCreate.mockResolvedValue(undefined);
    const ws3: DocumentItem = {
      documentId: "ws-3",
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
    expect(result.current.documents).toHaveLength(3);
  });
});
