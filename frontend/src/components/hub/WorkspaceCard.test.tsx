import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkspaceCard } from "./WorkspaceCard";
import type { WorkspaceItem } from "@/lib/workspace-client";

vi.mock("@/lib/annotation/format-relative-time", () => ({
  formatRelativeTime: () => "2h ago",
}));

const workspace: WorkspaceItem = {
  workspaceId: "ws-1",
  title: "Test Workspace",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
};

describe("WorkspaceCard", () => {
  let onOpen: ReturnType<typeof vi.fn>;
  let onRename: ReturnType<typeof vi.fn>;
  let onDuplicate: ReturnType<typeof vi.fn>;
  let onDelete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onOpen = vi.fn();
    onRename = vi.fn();
    onDuplicate = vi.fn();
    onDelete = vi.fn();
  });

  function renderCard() {
    return render(
      <WorkspaceCard
        workspace={workspace}
        onOpen={onOpen}
        onRename={onRename}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />,
    );
  }

  it("renders workspace title and relative time", () => {
    renderCard();
    expect(screen.getByText("Test Workspace")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
  });

  it("calls onOpen when clicking the card itself", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByTestId("workspaceCard-ws-1"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not call onOpen when clicking the menu trigger button", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByTestId("workspaceCardMenu"));

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("calls onOpen (not via card click) when selecting Open from dropdown", async () => {
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

  it("calls onRename but NOT onOpen when selecting Rename from dropdown", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByTestId("workspaceCardMenu"));

    const renameItem = await screen.findByRole("menuitem", { name: /rename/i });
    await user.click(renameItem);

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("calls onDuplicate but NOT onOpen when selecting Duplicate from dropdown", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByTestId("workspaceCardMenu"));

    const duplicateItem = await screen.findByRole("menuitem", { name: /duplicate/i });
    await user.click(duplicateItem);

    expect(onDuplicate).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("calls onDelete but NOT onOpen when selecting Delete from dropdown", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByTestId("workspaceCardMenu"));

    const deleteItem = await screen.findByRole("menuitem", { name: /delete/i });
    await user.click(deleteItem);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("renders 'Untitled' when workspace title is empty", () => {
    render(
      <WorkspaceCard
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
