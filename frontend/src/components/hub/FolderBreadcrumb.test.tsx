import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderBreadcrumb } from "./FolderBreadcrumb";
import { DndProvider } from "@/contexts/DndContext";
import type { FolderItem } from "@/lib/folder-client";

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

describe("FolderBreadcrumb", () => {
  let onNavigate: ReturnType<typeof vi.fn>;
  let onMoveToFolder: ReturnType<typeof vi.fn>;
  let onMoveFolder: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNavigate = vi.fn();
    onMoveToFolder = vi.fn();
    onMoveFolder = vi.fn();
  });

  function renderBreadcrumb(currentFolderId: string | null, folders: FolderItem[] = []) {
    return render(
      <DndProvider>
        <FolderBreadcrumb
          folders={folders}
          currentFolderId={currentFolderId}
          onNavigate={onNavigate}
          onMoveToFolder={onMoveToFolder}
          onMoveFolder={onMoveFolder}
        />
      </DndProvider>,
    );
  }

  describe("when currentFolderId is null", () => {
    it("then renders nothing", () => {
      const { container } = renderBreadcrumb(null);
      expect(container.innerHTML).toBe("");
    });
  });

  describe("when inside a root folder", () => {
    it("then shows My Documents > Folder Name", () => {
      const folders = [makeFolder({ id: "f1", name: "Study Notes" })];
      renderBreadcrumb("f1", folders);

      expect(screen.getByTestId("folderBreadcrumb")).toBeInTheDocument();
      expect(screen.getByTestId("breadcrumb-root")).toHaveTextContent("My Documents");
      expect(screen.getByTestId("breadcrumb-f1")).toHaveTextContent("Study Notes");
    });
  });

  describe("when inside a nested folder", () => {
    it("then shows full path with intermediate segments clickable", () => {
      const folders = [
        makeFolder({ id: "f1", name: "Root Folder" }),
        makeFolder({ id: "f2", name: "Sub Folder", parentId: "f1" }),
        makeFolder({ id: "f3", name: "Deep Folder", parentId: "f2" }),
      ];
      renderBreadcrumb("f3", folders);

      expect(screen.getByTestId("breadcrumb-root")).toHaveTextContent("My Documents");
      expect(screen.getByTestId("breadcrumb-f1")).toHaveTextContent("Root Folder");
      expect(screen.getByTestId("breadcrumb-f2")).toHaveTextContent("Sub Folder");
      expect(screen.getByTestId("breadcrumb-f3")).toHaveTextContent("Deep Folder");
    });
  });

  describe("when clicking My Documents breadcrumb", () => {
    it("then navigates to root (null)", async () => {
      const user = userEvent.setup();
      const folders = [makeFolder({ id: "f1", name: "Folder" })];
      renderBreadcrumb("f1", folders);

      await user.click(screen.getByTestId("breadcrumb-root"));
      expect(onNavigate).toHaveBeenCalledWith(null);
    });
  });

  describe("when clicking an intermediate breadcrumb segment", () => {
    it("then navigates to that folder", async () => {
      const user = userEvent.setup();
      const folders = [
        makeFolder({ id: "f1", name: "Root" }),
        makeFolder({ id: "f2", name: "Sub", parentId: "f1" }),
        makeFolder({ id: "f3", name: "Deep", parentId: "f2" }),
      ];
      renderBreadcrumb("f3", folders);

      await user.click(screen.getByTestId("breadcrumb-f1"));
      expect(onNavigate).toHaveBeenCalledWith("f1");
    });
  });
});
