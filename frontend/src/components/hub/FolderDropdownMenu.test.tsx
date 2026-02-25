import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FolderDropdownMenu } from "./FolderDropdownMenu";

function renderMenu(overrides: Partial<Parameters<typeof FolderDropdownMenu>[0]> = {}) {
  const props = {
    depth: 0,
    onRename: vi.fn(),
    onNewSubfolder: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<FolderDropdownMenu {...props} />);
  return props;
}

describe("FolderDropdownMenu", () => {
  describe("when rendered", () => {
    it("shows the menu trigger button", () => {
      renderMenu();
      expect(screen.getByTestId("folderMenu")).toBeInTheDocument();
    });
  });

  describe("when the menu trigger is clicked", () => {
    it("shows rename, new subfolder, and delete options", async () => {
      const user = userEvent.setup();
      renderMenu();
      await user.click(screen.getByTestId("folderMenu"));
      expect(await screen.findByText("Rename")).toBeInTheDocument();
      expect(screen.getByText("New Subfolder")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });
  });

  describe("when depth is 3 or more", () => {
    it("does not show the New Subfolder option", async () => {
      const user = userEvent.setup();
      renderMenu({ depth: 3 });
      await user.click(screen.getByTestId("folderMenu"));
      expect(await screen.findByText("Rename")).toBeInTheDocument();
      expect(screen.queryByText("New Subfolder")).not.toBeInTheDocument();
    });
  });

  describe("when Rename is selected", () => {
    it("calls onRename", async () => {
      const user = userEvent.setup();
      const props = renderMenu();
      await user.click(screen.getByTestId("folderMenu"));
      const renameItem = await screen.findByText("Rename");
      await user.click(renameItem);
      expect(props.onRename).toHaveBeenCalledOnce();
    });
  });

  describe("when Delete is selected", () => {
    it("calls onDelete", async () => {
      const user = userEvent.setup();
      const props = renderMenu();
      await user.click(screen.getByTestId("folderMenu"));
      const deleteItem = await screen.findByText("Delete");
      await user.click(deleteItem);
      expect(props.onDelete).toHaveBeenCalledOnce();
    });
  });
});
