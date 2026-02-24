import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceListItem } from "./WorkspaceListItem";
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
      <WorkspaceListItem
        workspace={workspace}
        onOpen={onOpen}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        ownerName="Test User"
        ownerAvatarUrl="https://example.com/avatar.jpg"
      />,
    );
  }

  it("renders workspace title and relative time", () => {
    renderListItem();
    expect(screen.getByText("List Workspace")).toBeInTheDocument();
    const dateElements = screen.getAllByText("3d ago");
    expect(dateElements.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onOpen when clicking the list item itself", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("workspaceListItem-ws-2"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not call onOpen when clicking the menu trigger button", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("workspaceListItemMenu"));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("calls onOpen (not via card click) when selecting Open from dropdown", async () => {
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

  it("calls onRename but NOT onOpen when selecting Rename from dropdown", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("workspaceListItemMenu"));

    const renameItem = await screen.findByRole("menuitem", { name: /rename/i });
    await user.click(renameItem);

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("calls onDuplicate but NOT onOpen when selecting Duplicate from dropdown", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("workspaceListItemMenu"));

    const duplicateItem = await screen.findByRole("menuitem", { name: /duplicate/i });
    await user.click(duplicateItem);

    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("calls onDelete but NOT onOpen when selecting Delete from dropdown", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("workspaceListItemMenu"));

    const deleteItem = await screen.findByRole("menuitem", { name: /delete/i });
    await user.click(deleteItem);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("displays created and modified dates", () => {
    renderListItem();
    const dateElements = screen.getAllByText("3d ago");
    expect(dateElements.length).toBeGreaterThanOrEqual(2);
  });

  it("displays owner name and avatar", () => {
    renderListItem();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    const avatar = document.querySelector("img[src='https://example.com/avatar.jpg']");
    expect(avatar).toBeInTheDocument();
  });

  it("calls onToggleFavorite when star is clicked", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("favoriteToggle"));

    expect(onToggleFavorite).toHaveBeenCalledWith("ws-2", true);
  });

  it("does not call onOpen when clicking favorite toggle", async () => {
    const user = userEvent.setup();
    renderListItem();

    await user.click(screen.getByTestId("favoriteToggle"));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("renders 'Untitled' when workspace title is empty", () => {
    render(
      <WorkspaceListItem
        workspace={{ ...workspace, title: "" }}
        onOpen={onOpen}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });
});
