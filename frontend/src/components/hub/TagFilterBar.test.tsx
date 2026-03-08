import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagFilterBar } from "./TagFilterBar";

describe("TagFilterBar", () => {
  const defaultTags = ["grace", "covenant", "prophecy"];

  describe("when no tags exist", () => {
    it("then renders nothing", () => {
      const { container } = render(
        <TagFilterBar
          allTags={[]}
          activeTags={[]}
          onToggleTag={vi.fn()}
          onClearFilters={vi.fn()}
        />,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("when tags exist", () => {
    it("then renders all tag buttons", () => {
      render(
        <TagFilterBar
          allTags={defaultTags}
          activeTags={[]}
          onToggleTag={vi.fn()}
          onClearFilters={vi.fn()}
        />,
      );

      expect(screen.getByTestId("tagFilter-grace")).toBeInTheDocument();
      expect(screen.getByTestId("tagFilter-covenant")).toBeInTheDocument();
      expect(screen.getByTestId("tagFilter-prophecy")).toBeInTheDocument();
    });
  });

  describe("when a tag is clicked", () => {
    it("then calls onToggleTag with the tag name", async () => {
      const onToggleTag = vi.fn();
      const user = userEvent.setup();
      render(
        <TagFilterBar
          allTags={defaultTags}
          activeTags={[]}
          onToggleTag={onToggleTag}
          onClearFilters={vi.fn()}
        />,
      );

      await user.click(screen.getByTestId("tagFilter-grace"));

      expect(onToggleTag).toHaveBeenCalledWith("grace");
    });
  });

  describe("when tags are active", () => {
    it("then shows the clear button", () => {
      render(
        <TagFilterBar
          allTags={defaultTags}
          activeTags={["grace"]}
          onToggleTag={vi.fn()}
          onClearFilters={vi.fn()}
        />,
      );

      expect(screen.getByTestId("clearTagFilters")).toBeInTheDocument();
    });

    it("then calls onClearFilters when clear is clicked", async () => {
      const onClearFilters = vi.fn();
      const user = userEvent.setup();
      render(
        <TagFilterBar
          allTags={defaultTags}
          activeTags={["grace"]}
          onToggleTag={vi.fn()}
          onClearFilters={onClearFilters}
        />,
      );

      await user.click(screen.getByTestId("clearTagFilters"));

      expect(onClearFilters).toHaveBeenCalledTimes(1);
    });
  });

  describe("when no tags are active", () => {
    it("then does not show the clear button", () => {
      render(
        <TagFilterBar
          allTags={defaultTags}
          activeTags={[]}
          onToggleTag={vi.fn()}
          onClearFilters={vi.fn()}
        />,
      );

      expect(screen.queryByTestId("clearTagFilters")).not.toBeInTheDocument();
    });
  });
});
