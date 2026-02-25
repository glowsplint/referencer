import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { PassageHeader } from "./PassageHeader";
import { renderWithWorkspace } from "@/test/render-with-workspace";

function renderHeader(overrides: Partial<Parameters<typeof PassageHeader>[0]> = {}) {
  const props = {
    name: "Passage 1",
    index: 0,
    onUpdateName: vi.fn(),
    ...overrides,
  };
  renderWithWorkspace(<PassageHeader {...props} />);
  return props;
}

describe("PassageHeader", () => {
  describe("when rendered", () => {
    it("shows the passage name", () => {
      renderHeader();
      expect(screen.getByTestId("passageHeader-0")).toHaveTextContent("Passage 1");
    });
  });

  describe("when the name is double-clicked", () => {
    it("enters editing mode with an input", () => {
      renderHeader();
      fireEvent.doubleClick(screen.getByTestId("passageHeader-0"));
      expect(screen.getByTestId("passageHeaderInput-0")).toBeInTheDocument();
      expect(screen.getByTestId("passageHeaderInput-0")).toHaveValue("Passage 1");
    });
  });

  describe("when editing and Enter is pressed", () => {
    it("calls onUpdateName with the new value and exits editing", () => {
      const props = renderHeader();
      fireEvent.doubleClick(screen.getByTestId("passageHeader-0"));
      const input = screen.getByTestId("passageHeaderInput-0");
      fireEvent.change(input, { target: { value: "New Name" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(props.onUpdateName).toHaveBeenCalledWith("New Name");
    });
  });

  describe("when editing and Escape is pressed", () => {
    it("exits editing without calling onUpdateName", () => {
      const props = renderHeader();
      fireEvent.doubleClick(screen.getByTestId("passageHeader-0"));
      const input = screen.getByTestId("passageHeaderInput-0");
      fireEvent.keyDown(input, { key: "Escape" });
      expect(props.onUpdateName).not.toHaveBeenCalled();
      expect(screen.getByTestId("passageHeader-0")).toBeInTheDocument();
    });
  });
});
