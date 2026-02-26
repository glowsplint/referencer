import { screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ButtonPane } from "./ButtonPane";
import { renderWithWorkspace } from "@/test/render-with-workspace";

function renderButtonPane(overrides = {}) {
  return renderWithWorkspace(<ButtonPane />, overrides);
}

describe("ButtonPane", () => {
  describe("when rendered", () => {
    it("then shows all toolbar buttons", () => {
      renderButtonPane();
      expect(screen.getByTestId("keyboardShortcutsButton")).toBeInTheDocument();
      expect(screen.getByTestId("faqButton")).toBeInTheDocument();
      expect(screen.getByTestId("settingsButton")).toBeInTheDocument();
      expect(screen.getByTestId("selectionToolButton")).toBeInTheDocument();
      expect(screen.getByTestId("arrowToolButton")).toBeInTheDocument();
      expect(screen.getByTestId("commentsToolButton")).toBeInTheDocument();
      expect(screen.getByTestId("eraserToolButton")).toBeInTheDocument();
      expect(screen.getByTestId("menuButton")).toBeInTheDocument();
      expect(screen.getByTestId("editorLayoutButton")).toBeInTheDocument();
      expect(screen.getByTestId("lockButton")).toBeInTheDocument();
    });

    it("then separates button groups with dividers", () => {
      renderButtonPane();
      const pane = screen.getByTestId("menuButton").parentElement!;
      const separators = pane.querySelectorAll('[role="separator"]');
      expect(separators).toHaveLength(3);
    });
  });

  describe("annotationToolGroup", () => {
    it("when rendered, then wraps arrow, highlight, comments, and underline buttons", () => {
      renderButtonPane();
      const group = screen.getByTestId("annotationToolGroup");
      expect(group).toBeInTheDocument();
      expect(group.querySelector('[data-testid="arrowToolButton"]')).toBeInTheDocument();
      expect(group.querySelector('[data-testid="highlightToolButton"]')).toBeInTheDocument();
      expect(group.querySelector('[data-testid="commentsToolButton"]')).toBeInTheDocument();
      expect(group.querySelector('[data-testid="underlineToolButton"]')).toBeInTheDocument();
    });

    it("when rendered, then does not contain the selection button", () => {
      renderButtonPane();
      const group = screen.getByTestId("annotationToolGroup");
      expect(group.querySelector('[data-testid="selectionToolButton"]')).not.toBeInTheDocument();
    });

    it("when rendered, then does not contain the eraser button", () => {
      renderButtonPane();
      const group = screen.getByTestId("annotationToolGroup");
      expect(group.querySelector('[data-testid="eraserToolButton"]')).not.toBeInTheDocument();
    });

    it("when rendered, then has display:contents style", () => {
      renderButtonPane();
      const group = screen.getByTestId("annotationToolGroup");
      expect(group.style.display).toBe("contents");
    });
  });

  describe("when the editor is not locked", () => {
    it("then disables tool buttons", () => {
      renderButtonPane({
        settings: {
          isDarkMode: false,
          isLayersOn: false,
          isMultipleRowsLayout: false,
          isLocked: false,
        },
      });
      expect(screen.getByTestId("selectionToolButton")).toBeDisabled();
      expect(screen.getByTestId("arrowToolButton")).toBeDisabled();
      expect(screen.getByTestId("commentsToolButton")).toBeDisabled();
    });
  });

  describe("when the editor is locked", () => {
    const lockedSettings = {
      settings: {
        isDarkMode: false,
        isLayersOn: false,
        isMultipleRowsLayout: false,
        isLocked: true,
      },
    };

    it("then enables tool buttons", () => {
      renderButtonPane(lockedSettings);
      expect(screen.getByTestId("selectionToolButton")).toBeEnabled();
      expect(screen.getByTestId("arrowToolButton")).toBeEnabled();
      expect(screen.getByTestId("commentsToolButton")).toBeEnabled();
    });

    describe("when the selection button is clicked", () => {
      it("then calls setActiveTool with selection", () => {
        const { workspace } = renderButtonPane(lockedSettings);
        fireEvent.click(screen.getByTestId("selectionToolButton"));
        expect(workspace.setActiveTool).toHaveBeenCalledWith("selection");
      });
    });

    describe("when the arrow button is clicked", () => {
      it("then calls setActiveTool with arrow", () => {
        const { workspace } = renderButtonPane(lockedSettings);
        fireEvent.click(screen.getByTestId("arrowToolButton"));
        expect(workspace.setActiveTool).toHaveBeenCalledWith("arrow");
      });
    });

    describe("when the comments button is clicked", () => {
      it("then calls setActiveTool with comments", () => {
        const { workspace } = renderButtonPane(lockedSettings);
        fireEvent.click(screen.getByTestId("commentsToolButton"));
        expect(workspace.setActiveTool).toHaveBeenCalledWith("comments");
      });
    });
  });

  describe("when the menu button is clicked", () => {
    it("then calls toggleManagementPane", () => {
      const { workspace } = renderButtonPane();
      fireEvent.click(screen.getByTestId("menuButton"));
      expect(workspace.toggleManagementPane).toHaveBeenCalledOnce();
    });
  });

  describe("when the layout button is clicked", () => {
    it("then calls toggleMultipleRowsLayout", () => {
      const { workspace } = renderButtonPane();
      fireEvent.click(screen.getByTestId("editorLayoutButton"));
      expect(workspace.toggleMultipleRowsLayout).toHaveBeenCalledOnce();
    });
  });

  describe("layout toggle icon", () => {
    function getLayoutIcon() {
      return screen.getByTestId("editorLayoutButton").querySelector("svg")!;
    }

    // In grid mode (isMultipleRowsLayout=false), iconOne is shown (rows/stack icons).
    // In stack mode (isMultipleRowsLayout=true), iconTwo is shown (grid icons).

    describe("when in grid mode with 1 editor", () => {
      it("then shows the square-round-corner icon", () => {
        renderButtonPane({ editorCount: 1, settings: { isMultipleRowsLayout: false } });
        expect(getLayoutIcon()).toHaveClass("lucide-square-round-corner");
      });
    });

    describe("when in grid mode with 2 editors", () => {
      it("then shows the rows-2 icon", () => {
        renderButtonPane({ editorCount: 2, settings: { isMultipleRowsLayout: false } });
        expect(getLayoutIcon()).toHaveClass("lucide-rows-2");
      });
    });

    describe("when in grid mode with 3 editors", () => {
      it("then shows the rows-3 icon", () => {
        renderButtonPane({ editorCount: 3, settings: { isMultipleRowsLayout: false } });
        expect(getLayoutIcon()).toHaveClass("lucide-rows-3");
      });
    });

    describe("when in grid mode with 4 editors", () => {
      it("then shows the rows-4 icon", () => {
        renderButtonPane({ editorCount: 4, settings: { isMultipleRowsLayout: false } });
        expect(getLayoutIcon()).toHaveClass("lucide-rows-4");
      });
    });

    describe("when in stack mode with 1 editor", () => {
      it("then shows the square-round-corner icon", () => {
        renderButtonPane({ editorCount: 1, settings: { isMultipleRowsLayout: true } });
        expect(getLayoutIcon()).toHaveClass("lucide-square-round-corner");
      });
    });

    describe("when in stack mode with 2 editors", () => {
      it("then shows the columns-2 icon", () => {
        renderButtonPane({ editorCount: 2, settings: { isMultipleRowsLayout: true } });
        expect(getLayoutIcon()).toHaveClass("lucide-columns-2");
      });
    });

    describe("when in stack mode with 3 editors", () => {
      it("then shows the layout-panel-top icon rotated", () => {
        renderButtonPane({ editorCount: 3, settings: { isMultipleRowsLayout: true } });
        const icon = getLayoutIcon();
        expect(icon).toHaveClass("lucide-layout-panel-top");
        expect(icon).toHaveClass("rotate-180");
      });
    });

    describe("when in stack mode with 4 editors", () => {
      it("then shows the layout-grid icon", () => {
        renderButtonPane({ editorCount: 4, settings: { isMultipleRowsLayout: true } });
        expect(getLayoutIcon()).toHaveClass("lucide-layout-grid");
      });
    });
  });

  describe("comment placement icon", () => {
    function getCommentIcon() {
      return screen.getByTestId("commentPlacementButton").querySelector("svg")!;
    }

    describe("when comment placement is right", () => {
      it("then shows the panel-right-close icon", () => {
        renderButtonPane({ settings: { commentPlacement: "right" } });
        expect(getCommentIcon()).toHaveClass("lucide-panel-right-close");
      });
    });

    describe("when comment placement is left", () => {
      it("then shows the panel-left-close icon", () => {
        renderButtonPane({ settings: { commentPlacement: "left" } });
        expect(getCommentIcon()).toHaveClass("lucide-panel-left-close");
      });
    });

    describe("when comment placement is both", () => {
      it("then shows the columns-2 icon", () => {
        renderButtonPane({ settings: { commentPlacement: "both" } });
        expect(getCommentIcon()).toHaveClass("lucide-columns-2");
      });
    });
  });

  describe("when the lock button is clicked", () => {
    it("then calls toggleLocked", () => {
      const { workspace } = renderButtonPane();
      fireEvent.click(screen.getByTestId("lockButton"));
      expect(workspace.toggleLocked).toHaveBeenCalledOnce();
    });
  });

  describe("when the keyboard shortcuts button is clicked", () => {
    it("then opens the keyboard shortcuts dialog", () => {
      renderButtonPane();
      fireEvent.click(screen.getByTestId("keyboardShortcutsButton"));
      expect(screen.getByTestId("keyboardShortcutsDialog")).toBeInTheDocument();
      expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
    });
  });

  describe("when the FAQ button is clicked", () => {
    it("then opens the FAQ dialog", () => {
      renderButtonPane();
      fireEvent.click(screen.getByTestId("faqButton"));
      expect(screen.getByTestId("faqDialog")).toBeInTheDocument();
      expect(screen.getByText("Frequently Asked Questions")).toBeInTheDocument();
    });
  });

  describe("when the settings button is clicked", () => {
    it("then opens the settings dialog", () => {
      renderButtonPane();
      fireEvent.click(screen.getByTestId("settingsButton"));
      expect(screen.getByTestId("settingsDialog")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });
  });

  describe("tooltips", () => {
    describe("when the selection tool button receives focus", () => {
      it("then shows a tooltip with the shortcut key", async () => {
        renderButtonPane({
          settings: {
            isDarkMode: false,
            isLayersOn: false,
            isMultipleRowsLayout: false,
            isLocked: true,
          },
        });
        const btn = screen.getByTestId("selectionToolButton");

        await act(async () => {
          fireEvent.focus(btn);
        });

        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip).toHaveTextContent("Selection tool");
        expect(tooltip.querySelector("kbd")).toHaveTextContent("S");
      });
    });

    describe("when the arrow tool button receives focus", () => {
      it("then shows a tooltip with the shortcut key", async () => {
        renderButtonPane({
          settings: {
            isDarkMode: false,
            isLayersOn: false,
            isMultipleRowsLayout: false,
            isLocked: true,
          },
        });
        const btn = screen.getByTestId("arrowToolButton");

        await act(async () => {
          fireEvent.focus(btn);
        });

        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip).toHaveTextContent("Arrow tool");
        expect(tooltip.querySelector("kbd")).toHaveTextContent("A");
      });
    });

    describe("when the lock button receives focus", () => {
      it("then shows a tooltip with the shortcut key", async () => {
        renderButtonPane();
        const btn = screen.getByTestId("lockButton");

        await act(async () => {
          fireEvent.focus(btn);
        });

        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip).toHaveTextContent("Toggle editor lock");
        expect(tooltip.querySelector("kbd")).toHaveTextContent("K");
      });
    });

    describe("when the menu button receives focus", () => {
      it("then shows a tooltip with the shortcut key", async () => {
        renderButtonPane();
        const btn = screen.getByTestId("menuButton");

        await act(async () => {
          fireEvent.focus(btn);
        });

        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip).toHaveTextContent("Toggle management pane");
        expect(tooltip.querySelector("kbd")).toHaveTextContent("M");
      });
    });

    describe("when the keyboard shortcuts button receives focus", () => {
      it("then shows a tooltip without a shortcut key", async () => {
        renderButtonPane();
        const btn = screen.getByTestId("keyboardShortcutsButton");

        await act(async () => {
          fireEvent.focus(btn);
        });

        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip).toHaveTextContent("Keyboard shortcuts");
        expect(tooltip.querySelector("kbd")).not.toBeInTheDocument();
      });
    });
  });

  describe("arrow style picker", () => {
    const lockedSettings = {
      settings: {
        isDarkMode: false,
        isLayersOn: false,
        isMultipleRowsLayout: false,
        isLocked: true,
      },
    };

    describe("when activeTool is arrow", () => {
      it("then opens the arrow style picker", () => {
        const { workspace } = renderButtonPane({
          ...lockedSettings,
          annotations: { activeTool: "arrow" },
        });
        expect(workspace.setArrowStylePickerOpen).toHaveBeenCalledWith(true);
      });
    });

    describe("when activeTool is not arrow", () => {
      it("then closes the arrow style picker", () => {
        const { workspace } = renderButtonPane({
          ...lockedSettings,
          annotations: { activeTool: "selection" },
        });
        expect(workspace.setArrowStylePickerOpen).toHaveBeenCalledWith(false);
      });
    });

    describe("when an arrow is selected", () => {
      it("then activates the arrow tool", () => {
        const { workspace } = renderButtonPane({
          ...lockedSettings,
          selectedArrow: { layerId: "layer-1", arrowId: "arrow-1" },
        });
        expect(workspace.setActiveTool).toHaveBeenCalledWith("arrow");
      });
    });

    describe("when arrowStylePickerOpen is true", () => {
      it("then shows the arrow style popover", () => {
        renderButtonPane({
          ...lockedSettings,
          arrowStylePickerOpen: true,
        });
        expect(screen.getByTestId("arrowStylePopover")).toBeInTheDocument();
        expect(screen.getByTestId("arrowStylePicker--1")).toBeInTheDocument();
      });
    });

    describe("when arrowStylePickerOpen is false", () => {
      it("then does not show the arrow style popover", () => {
        renderButtonPane({
          ...lockedSettings,
          arrowStylePickerOpen: false,
        });
        expect(screen.queryByTestId("arrowStylePopover")).not.toBeInTheDocument();
      });
    });

    describe("when a style is selected", () => {
      it("then calls setActiveArrowStyle", () => {
        const { workspace } = renderButtonPane({
          ...lockedSettings,
          arrowStylePickerOpen: true,
        });

        fireEvent.click(screen.getByTestId("arrowStyleOption-dashed"));

        expect(workspace.setActiveArrowStyle).toHaveBeenCalledWith("dashed");
      });
    });

    describe("when a style is selected and an arrow is selected", () => {
      it("then calls updateArrowStyle for the selected arrow", () => {
        const { workspace } = renderButtonPane({
          ...lockedSettings,
          arrowStylePickerOpen: true,
          selectedArrow: { layerId: "layer-1", arrowId: "arrow-1" },
        });

        fireEvent.click(screen.getByTestId("arrowStyleOption-dashed"));

        expect(workspace.updateArrowStyle).toHaveBeenCalledWith("layer-1", "arrow-1", "dashed");
        expect(workspace.setActiveArrowStyle).toHaveBeenCalledWith("dashed");
      });
    });

    describe("when a style is selected and no arrow is selected", () => {
      it("then does not call updateArrowStyle", () => {
        const { workspace } = renderButtonPane({
          ...lockedSettings,
          arrowStylePickerOpen: true,
          selectedArrow: null,
        });

        fireEvent.click(screen.getByTestId("arrowStyleOption-dashed"));

        expect(workspace.updateArrowStyle).not.toHaveBeenCalled();
        expect(workspace.setActiveArrowStyle).toHaveBeenCalledWith("dashed");
      });
    });

    describe("when activeArrowStyle is dashed", () => {
      it("then renders the arrow button icon with dashed stroke", () => {
        renderButtonPane({
          ...lockedSettings,
          activeArrowStyle: "dashed",
        });
        const btn = screen.getByTestId("arrowToolButton");
        const svg = btn.querySelector("svg");
        expect(svg).toBeInTheDocument();
        const line = svg!.querySelector("line");
        expect(line).toHaveAttribute("stroke-dasharray", "4 2.5");
      });
    });
  });
});
