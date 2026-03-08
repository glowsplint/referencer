import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "./TagInput";

describe("TagInput", () => {
  let onAddTag: ReturnType<typeof vi.fn>;
  let onRemoveTag: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onAddTag = vi.fn();
    onRemoveTag = vi.fn();
  });

  function renderTagInput(
    overrides: {
      currentTags?: string[];
      allTags?: string[];
    } = {},
  ) {
    return render(
      <TagInput
        documentId="doc-1"
        currentTags={overrides.currentTags ?? []}
        allTags={overrides.allTags ?? ["grace", "covenant", "prophecy"]}
        onAddTag={onAddTag}
        onRemoveTag={onRemoveTag}
      />,
    );
  }

  describe("when rendered with existing tags", () => {
    it("then shows tag chips", () => {
      renderTagInput({ currentTags: ["grace", "covenant"] });
      expect(screen.getByText("#grace")).toBeInTheDocument();
      expect(screen.getByText("#covenant")).toBeInTheDocument();
    });
  });

  describe("when rendered with no tags", () => {
    it("then shows the input placeholder", () => {
      renderTagInput();
      expect(screen.getByPlaceholderText("Add tag...")).toBeInTheDocument();
    });
  });

  describe("when a valid tag is typed and Enter pressed", () => {
    it("then calls onAddTag", async () => {
      const user = userEvent.setup();
      renderTagInput();

      await user.type(screen.getByTestId("tagInput"), "grace{Enter}");

      expect(onAddTag).toHaveBeenCalledWith("doc-1", "grace");
    });
  });

  describe("when a tag with # prefix is typed", () => {
    it("then normalizes and calls onAddTag", async () => {
      const user = userEvent.setup();
      renderTagInput();

      await user.type(screen.getByTestId("tagInput"), "#covenant{Enter}");

      expect(onAddTag).toHaveBeenCalledWith("doc-1", "covenant");
    });
  });

  describe("when an invalid tag is typed", () => {
    it("then shows error and does not call onAddTag", async () => {
      const user = userEvent.setup();
      renderTagInput();

      await user.type(screen.getByTestId("tagInput"), "invalid tag!{Enter}");

      expect(onAddTag).not.toHaveBeenCalled();
      expect(screen.getByTestId("tagError")).toBeInTheDocument();
    });
  });

  describe("when the remove button is clicked on a tag chip", () => {
    it("then calls onRemoveTag", async () => {
      const user = userEvent.setup();
      renderTagInput({ currentTags: ["grace"] });

      const removeButton = screen.getByLabelText("Remove tag");
      await user.click(removeButton);

      expect(onRemoveTag).toHaveBeenCalledWith("doc-1", "grace");
    });
  });

  describe("when typing in the input", () => {
    it("then shows autocomplete suggestions", async () => {
      const user = userEvent.setup();
      renderTagInput({ allTags: ["grace", "covenant", "grace-note"] });

      await user.type(screen.getByTestId("tagInput"), "gra");

      expect(screen.getByTestId("tagSuggestion-grace")).toBeInTheDocument();
      expect(screen.getByTestId("tagSuggestion-grace-note")).toBeInTheDocument();
    });

    it("then filters out already-applied tags from suggestions", async () => {
      const user = userEvent.setup();
      renderTagInput({
        currentTags: ["grace"],
        allTags: ["grace", "grace-note"],
      });

      await user.type(screen.getByTestId("tagInput"), "gra");

      expect(screen.queryByTestId("tagSuggestion-grace")).not.toBeInTheDocument();
      expect(screen.getByTestId("tagSuggestion-grace-note")).toBeInTheDocument();
    });
  });

  describe("when max tags reached", () => {
    it("then shows error message", async () => {
      const user = userEvent.setup();
      const twentyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      renderTagInput({ currentTags: twentyTags });

      await user.type(screen.getByTestId("tagInput"), "newtag{Enter}");

      expect(onAddTag).not.toHaveBeenCalled();
      expect(screen.getByTestId("tagError")).toBeInTheDocument();
    });
  });
});
