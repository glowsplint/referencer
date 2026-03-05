import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SectionList } from "./SectionList";

function renderList(overrides = {}) {
  const defaults = {
    editorCount: 1,
    sectionVisibility: [true],
    sectionNames: ["Text 1"],
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
    it("then shows the Texts heading", () => {
      renderList();
      expect(screen.getByText("Texts")).toBeInTheDocument();
    });

    it("then shows the add text button", () => {
      renderList();
      expect(screen.getByTestId("addTextButton")).toBeInTheDocument();
    });

    it("then shows the master visibility toggle", () => {
      renderList();
      expect(screen.getByTestId("toggleAllSectionVisibility")).toBeInTheDocument();
    });
  });

  describe("when texts exist", () => {
    it("then shows text labels", () => {
      renderList({
        editorCount: 3,
        sectionVisibility: [true, true, true],
        sectionNames: ["Text 1", "Text 2", "Text 3"],
      });
      expect(screen.getByText("Text 1")).toBeInTheDocument();
      expect(screen.getByText("Text 2")).toBeInTheDocument();
      expect(screen.getByText("Text 3")).toBeInTheDocument();
    });

    it("then shows a visibility toggle for each text", () => {
      renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Text 1", "Text 2"],
      });
      expect(screen.getByTestId("sectionVisibility-0")).toBeInTheDocument();
      expect(screen.getByTestId("sectionVisibility-1")).toBeInTheDocument();
    });

    it("then renders custom text names from props", () => {
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
    it("then calls toggleSectionVisibility with the text index", () => {
      const { props } = renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Text 1", "Text 2"],
      });
      fireEvent.click(screen.getByTestId("sectionVisibility-1"));
      expect(props.toggleSectionVisibility).toHaveBeenCalledWith(1);
    });
  });

  describe("when a text is visible", () => {
    it("then shows Hide text as the toggle title", () => {
      renderList({ editorCount: 1, sectionVisibility: [true] });
      expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Hide text");
    });
  });

  describe("when a text is hidden", () => {
    it("then shows Show text as the toggle title", () => {
      renderList({ editorCount: 1, sectionVisibility: [false] });
      expect(screen.getByTestId("sectionVisibility-0")).toHaveAttribute("title", "Show text");
    });
  });

  describe("when multiple texts exist", () => {
    it("then allows reordering texts via drag", () => {
      renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Text 1", "Text 2"],
      });
      const row = screen.getByTestId("textName-0").closest("[draggable]");
      expect(row).toHaveAttribute("draggable", "true");
    });

    it("then sets section index in dataTransfer on drag start", () => {
      renderList({
        editorCount: 2,
        sectionVisibility: [true, true],
        sectionNames: ["Text 1", "Text 2"],
      });
      const row = screen.getByTestId("textName-1").closest("[draggable]")!;
      const setData = vi.fn();
      fireEvent.dragStart(row, { dataTransfer: { setData } });
      expect(setData).toHaveBeenCalledWith("application/x-section-index", "1");
    });
  });

  describe("when dragging a text downward", () => {
    it("then shows border-b-2 on the drop target", () => {
      renderList({
        editorCount: 3,
        sectionVisibility: [true, true, true],
        sectionNames: ["Text 1", "Text 2", "Text 3"],
      });
      const row0 = screen.getByTestId("textRow-0");
      const row2 = screen.getByTestId("textRow-2");
      fireEvent.dragStart(row0, {
        dataTransfer: { setData: vi.fn(), types: ["application/x-section-index"] },
      });
      fireEvent.dragOver(row2, {
        dataTransfer: { types: ["application/x-section-index"] },
      });
      expect(row2.className).toContain("border-b-2");
      expect(row2.className).not.toContain("border-t-2");
    });
  });

  describe("when dragging a text upward", () => {
    it("then shows border-t-2 on the drop target", () => {
      renderList({
        editorCount: 3,
        sectionVisibility: [true, true, true],
        sectionNames: ["Text 1", "Text 2", "Text 3"],
      });
      const row2 = screen.getByTestId("textRow-2");
      const row0 = screen.getByTestId("textRow-0");
      fireEvent.dragStart(row2, {
        dataTransfer: { setData: vi.fn(), types: ["application/x-section-index"] },
      });
      fireEvent.dragOver(row0, {
        dataTransfer: { types: ["application/x-section-index"] },
      });
      expect(row0.className).toContain("border-t-2");
      expect(row0.className).not.toContain("border-b-2");
    });
  });

  describe("when only one text exists", () => {
    it("then does not allow dragging", () => {
      renderList();
      const row = screen.getByTestId("textName-0").parentElement;
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

  describe("when the add text button is clicked", () => {
    it("then calls addEditor", () => {
      const { props } = renderList();
      fireEvent.click(screen.getByTestId("addTextButton"));
      expect(props.addEditor).toHaveBeenCalled();
    });
  });

  describe("when inline editing", () => {
    describe("when a text name is double-clicked", () => {
      it("then enters edit mode with the current name", () => {
        renderList();
        fireEvent.doubleClick(screen.getByTestId("textName-0"));
        expect(screen.getByTestId("textNameInput-0")).toBeInTheDocument();
        expect(screen.getByTestId("textNameInput-0")).toHaveValue("Text 1");
      });
    });

    describe("when Enter is pressed during editing", () => {
      it("then commits the new name", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("textName-0"));
        fireEvent.change(screen.getByTestId("textNameInput-0"), {
          target: { value: "Renamed" },
        });
        fireEvent.keyDown(screen.getByTestId("textNameInput-0"), { key: "Enter" });
        expect(props.onUpdateName).toHaveBeenCalledWith(0, "Renamed");
      });
    });

    describe("when Escape is pressed during editing", () => {
      it("then cancels the edit without committing", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("textName-0"));
        fireEvent.change(screen.getByTestId("textNameInput-0"), {
          target: { value: "Renamed" },
        });
        fireEvent.keyDown(screen.getByTestId("textNameInput-0"), { key: "Escape" });
        expect(props.onUpdateName).not.toHaveBeenCalled();
        expect(screen.getByTestId("textName-0")).toBeInTheDocument();
      });
    });

    describe("when the input loses focus", () => {
      it("then commits the new name", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("textName-0"));
        fireEvent.change(screen.getByTestId("textNameInput-0"), {
          target: { value: "Blurred" },
        });
        fireEvent.blur(screen.getByTestId("textNameInput-0"));
        expect(props.onUpdateName).toHaveBeenCalledWith(0, "Blurred");
      });
    });

    describe("when an empty name is submitted", () => {
      it("then reverts to the original name", () => {
        const { props } = renderList();
        fireEvent.doubleClick(screen.getByTestId("textName-0"));
        fireEvent.change(screen.getByTestId("textNameInput-0"), {
          target: { value: "   " },
        });
        fireEvent.keyDown(screen.getByTestId("textNameInput-0"), { key: "Enter" });
        expect(props.onUpdateName).toHaveBeenCalledWith(0, "Text 1");
      });
    });
  });
});
