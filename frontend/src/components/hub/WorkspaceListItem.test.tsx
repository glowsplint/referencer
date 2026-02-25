import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceListItem } from "./WorkspaceListItem";
import { DndProvider } from "@/contexts/DndContext";
import type { WorkspaceItem } from "@/lib/workspace-client";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "3d ago",
}));

const workspace: WorkspaceItem = {
  workspaceId: "ws-2",
  title: "List Workspace",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-03T00:00:00Z",
  isFavorite: false,
  folderId: null,
};

describe("WorkspaceListItem", () => {
  let onOpen: ReturnType<typeof vi.fn>;
  let onRename: ReturnType<typeof vi.fn>;
  let onDuplicate: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;
  let onToggleFavorite: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onOpen = vi.fn();
    onRename = vi.fn();
    onDuplicate = vi.fn();
    onDelete = vi.fn();
    onToggleFavorite = vi.fn();
  });

  function renderListItem() {
    return render(
      <DndProvider>
        <WorkspaceListItem
          workspace={workspace}
          onOpen={onOpen}
          onRename={onRename}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          ownerName="Test User"
          ownerAvatarUrl="https://example.com/avatar.jpg"
        />
      </DndProvider>,
    );
  }

  describe("when rendered", () => {
    it("shows the workspace title and relative time", () => {
      renderListItem();
      expect(screen.getByText("List Workspace")).toBeInTheDocument();
      const dateElements = screen.getAllByText("3d ago");
      expect(dateElements.length).toBeGreaterThanOrEqual(1);
    });

    it("shows created and modified dates", () => {
      renderListItem();
      const dateElements = screen.getAllByText("3d ago");
      expect(dateElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("when workspace has an owner", () => {
    it("shows the owner name and avatar", () => {
      renderListItem();
      expect(screen.getByText("Test User")).toBeInTheDocument();
      const avatar = document.querySelector("img[src='https://example.com/avatar.jpg']");
      expect(avatar).toBeInTheDocument();
    });
  });

  describe("when the list item is clicked", () => {
    it("calls onOpen", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("workspaceListItem-ws-2"));

      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the menu trigger is clicked", () => {
    it("does not call onOpen", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("workspaceListItemMenu"));

      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when Open is selected from the dropdown menu", () => {
    it("calls onOpen", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("workspaceListItemMenu"));
      const openItem = await screen.findByRole("menuitem", { name: /open/i });
      await user.click(openItem);

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onRename).not.toHaveBeenCalled();
      expect(onDuplicate).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe("when Rename is selected from the dropdown menu", () => {
    it("calls onRename without calling onOpen", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("workspaceListItemMenu"));
      const renameItem = await screen.findByRole("menuitem", { name: /rename/i });
      await user.click(renameItem);

      expect(onRename).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when Duplicate is selected from the dropdown menu", () => {
    it("calls onDuplicate without calling onOpen", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("workspaceListItemMenu"));
      const duplicateItem = await screen.findByRole("menuitem", { name: /duplicate/i });
      await user.click(duplicateItem);

      expect(onDuplicate).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when Delete is selected from the dropdown menu", () => {
    it("calls onDelete without calling onOpen", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("workspaceListItemMenu"));
      const deleteItem = await screen.findByRole("menuitem", { name: /delete/i });
      await user.click(deleteItem);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when favorite toggle is clicked", () => {
    it("calls onToggleFavorite with the workspace ID and new state", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("favoriteToggle"));

      expect(onToggleFavorite).toHaveBeenCalledWith("ws-2", true);
    });

    it("does not call onOpen", async () => {
      const user = userEvent.setup();
      renderListItem();

      await user.click(screen.getByTestId("favoriteToggle"));

      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when workspace title is empty", () => {
    it("renders 'Untitled' as the title", () => {
      render(
        <DndProvider>
          <WorkspaceListItem
            workspace={{ ...workspace, title: "" }}
            onOpen={onOpen}
            onRename={onRename}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            ownerName="Test User"
            ownerAvatarUrl="https://example.com/avatar.jpg"
          />
        </DndProvider>,
      );
      expect(screen.getByText("Untitled")).toBeInTheDocument();
    });
  });
});
