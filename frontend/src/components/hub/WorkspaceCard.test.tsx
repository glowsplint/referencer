import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCard } from "./WorkspaceCard";
import { DndProvider } from "@/contexts/DndContext";
import type { WorkspaceItem } from "@/lib/workspace-client";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "2h ago",
}));

const workspace: WorkspaceItem = {
  workspaceId: "ws-1",
  title: "Test Workspace",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  isFavorite: false,
  folderId: null,
};

describe("WorkspaceCard", () => {
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

  function renderCard(overrides?: Partial<WorkspaceItem>) {
    return render(
      <DndProvider>
        <WorkspaceCard
          workspace={{ ...workspace, ...overrides }}
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
    it("then shows the workspace title and last modified time", () => {
      renderCard();
      expect(screen.getByText("Test Workspace")).toBeInTheDocument();
      expect(screen.getByText(/2h ago/)).toBeInTheDocument();
    });

    it("then shows both created and modified dates", () => {
      renderCard();
      expect(screen.getByText(/Modified 2h ago/)).toBeInTheDocument();
      expect(screen.getByText(/Created 2h ago/)).toBeInTheDocument();
    });
  });

  describe("when workspace has an owner", () => {
    it("then shows the owner name and avatar", () => {
      renderCard();
      expect(screen.getByText("Test User")).toBeInTheDocument();
      const avatar = document.querySelector("img[src='https://example.com/avatar.jpg']");
      expect(avatar).toBeInTheDocument();
    });
  });

  describe("when the card is clicked", () => {
    it("then calls onOpen", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("workspaceCard-ws-1"));

      expect(onOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe("when the menu trigger is clicked", () => {
    it("then does not call onOpen", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("workspaceCardMenu"));

      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when Open is selected from the dropdown menu", () => {
    it("then calls onOpen", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("workspaceCardMenu"));
      const openItem = await screen.findByRole("menuitem", { name: /open/i });
      await user.click(openItem);

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onRename).not.toHaveBeenCalled();
      expect(onDuplicate).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe("when Rename is selected from the dropdown menu", () => {
    it("then calls onRename without calling onOpen", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("workspaceCardMenu"));
      const renameItem = await screen.findByRole("menuitem", { name: /rename/i });
      await user.click(renameItem);

      expect(onRename).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when Duplicate is selected from the dropdown menu", () => {
    it("then calls onDuplicate without calling onOpen", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("workspaceCardMenu"));
      const duplicateItem = await screen.findByRole("menuitem", { name: /duplicate/i });
      await user.click(duplicateItem);

      expect(onDuplicate).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when Delete is selected from the dropdown menu", () => {
    it("then calls onDelete without calling onOpen", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("workspaceCardMenu"));
      const deleteItem = await screen.findByRole("menuitem", { name: /delete/i });
      await user.click(deleteItem);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when favorite toggle is clicked", () => {
    it("then calls onToggleFavorite with the workspace ID and new state", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("favoriteToggle"));

      expect(onToggleFavorite).toHaveBeenCalledWith("ws-1", true);
    });

    it("then does not call onOpen", async () => {
      const user = userEvent.setup();
      renderCard();

      await user.click(screen.getByTestId("favoriteToggle"));

      expect(onOpen).not.toHaveBeenCalled();
    });
  });

  describe("when workspace title is empty", () => {
    it("then renders 'Untitled' as the title", () => {
      render(
        <DndProvider>
          <WorkspaceCard
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
