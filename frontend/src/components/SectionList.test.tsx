import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SectionList } from "./SectionList";

function renderList(overrides = {}) {
  const defaults = {
    editorCount: 1,
    sectionVisibility: [true],
    sectionNames: ["Passage 1"],
    addEditor: vi.fn(),
    removeEditor: vi.fn(),
    onUpdateName: vi.fn(),
    onReorder: vi.fn(),
    toggleSectionVisibility: vi.fn(),
    toggleAllSectionVisibility: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  return { ...render(<SectionList {...props} />), props };
}

describe("SectionList", () => {
  describe("when rendered", () => {
    it("then shows the Passages heading", () => {
      renderList();
      expect(screen.getByText("Passages")).toBeInTheDocument();
    });

    it("then shows the add passage button", () => {
      renderList();
      expect(screen.getByTestId("addPassageButton")).toBeInTheDocument();
    });

    it("then shows the master visibility toggle", () => {
      renderList();
      expect(screen.getByTestId("toggleAllSectionVisibility")).toBeInTheDocument();
    });
  });

  describe("when passages exist", () => {
    it("then shows passage labels", () => {
      renderList({
        editorCount: 3,
        sectionVisibility: [true, true, true],
        sectionNames: ["Passage 1", "Passage 2", "Passage 3"],
      });
      expect(screen.getByText("Passage 1")).toBeInTheDocument();
      expect(screen.getByText("Passage 2")).toBeInTheDocument();
      expect(screen.getByText("Passage 3")).toBeInTheDocument();
    });

    it("then shows a visibility toggle for each passage", () => {
      renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Passage 1", "Passage 2"],
      });
      expect(screen.getByTestId("sectionVisibility-0")).toBeInTheDocument();
      expect(screen.getByTestId("sectionVisibility-1")).toBeInTheDocument();
    });

    it("then renders custom passage names from props", () => {
      renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Intro", "Body"],
      });
      expect(screen.getByText("Intro")).toBeInTheDocument();
      expect(screen.getByText("Body")).toBeInTheDocument();
    });
  });

  describe("when a visibility toggle is clicked", () => {
    it("then calls toggleSectionVisibility with the passage index", () => {
      const { props } = renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Passage 1", "Passage 2"],
      });
      fireEvent.click(screen.getByTestId("sectionVisibility-1"));
      expect(props.toggleSectionVisibility).toHaveBeenCalledWith(1);
    });
  });

  describe("when a passage is visible", () => {
    it("then shows Hide passage as the toggle title", () => {
      renderList({ editorCount: 1, sectionVisibility: [true] });
      expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Hide passage");
    });
  });

  describe("when a passage is hidden", () => {
    it("then shows Show passage as the toggle title", () => {
      renderList({ editorCount: 1, sectionVisibility: [false] });
      expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Show passage");
    });
  });

  describe("when multiple passages exist", () => {
    it("then allows reordering passages via drag", () => {
      renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Passage 1", "Passage 2"],
      });
      const row = screen.getByTestId("passageName-0").closest("[draggable]");
      expect(row).toHaveAttribute("draggable", "true");
    });

    it("then sets section index in dataTransfer on drag start", () => {
      renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Passage 1", "Passage 2"],
      });
      const row = screen.getByTestId("passageName-1").closest("[draggable]")!;
      const setData = vi.fn();
      fireEvent.dragStart(row, { dataTransfer: { setData } });
      expect(setData).toHaveBeenCalledWith("application/x-section-index", "1");
    });
  });

  describe("when only one passage exists", () => {
    it("then does not allow dragging", () => {
      renderList();
      const row = screen.getByTestId("passageName-0").parentElement;
      expect(row).not.toHaveAttribute("draggable", "true");
    });
  });

  describe("when the master visibility button is clicked", () => {
    it("then calls toggleAllSectionVisibility", () => {
      const { props } = renderList();
      fireEvent.click(screen.getByTestId("toggleAllSectionVisibility"));
      expect(props.toggleAllSectionVisibility).toHaveBeenCalled();
    });
  });

  describe("when the add passage button is clicked", () => {
    it("then calls addEditor", () => {
      const { props } = renderList();
      fireEvent.click(screen.getByTestId("addPassageButton"));
      expect(props.addEditor).toHaveBeenCalled();
    });
  });

  describe("when inline editing", () => {
    describe("when a passage name is double-clicked", () => {
      it("then enters edit mode with the current name", () => {
        renderList();
        fireEvent.doubleClick(screen.getByTestId("passageName-0"));
        expect(screen.getByTestId("passageNameInput-0")).toBeInTheDocument();
        expect(screen.getByTestId("passageNameInput-0")).toHaveValue("Passage 1");
      });
    });

    describe("when Enter is pressed during editing", () => {
      it("then commits the new name", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("passageName-0"));
        fireEvent.change(screen.getByTestId("passageNameInput-0"), {
          target: { value: "Renamed" },
        });
        fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Enter" });
        expect(props.onUpdateName).toHaveBeenCalledWith(0, "Renamed");
      });
    });

    describe("when Escape is pressed during editing", () => {
      it("then cancels the edit without committing", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("passageName-0"));
        fireEvent.change(screen.getByTestId("passageNameInput-0"), {
          target: { value: "Renamed" },
        });
        fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Escape" });
        expect(props.onUpdateName).not.toHaveBeenCalled();
        expect(screen.getByTestId("passageName-0")).toBeInTheDocument();
      });
    });

    describe("when the input loses focus", () => {
      it("then commits the new name", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("passageName-0"));
        fireEvent.change(screen.getByTestId("passageNameInput-0"), {
          target: { value: "Blurred" },
        });
        fireEvent.blur(screen.getByTestId("passageNameInput-0"));
        expect(props.onUpdateName).toHaveBeenCalledWith(0, "Blurred");
      });
    });

    describe("when an empty name is submitted", () => {
      it("then reverts to the original name", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("passageName-0"));
        fireEvent.change(screen.getByTestId("passageNameInput-0"), {
          target: { value: "   " },
        });
        fireEvent.keyDown(screen.getByTestId("passageNameInput-0"), { key: "Enter" });
        expect(props.onUpdateName).toHaveBeenCalledWith(0, "Passage 1");
      });
    });
  });
});
