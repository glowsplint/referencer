import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ColorPicker } from "./ColorPicker";
import { TAILWIND_300_COLORS } from "@/constants/colors";

// Mock react-colorful: HexColorPicker is canvas-based (no DOM in jsdom),
// and HexColorInput needs to behave as a controlled input with onChange.
vi.mock("react-colorful", () => ({
  HexColorPicker: ({ color }: { color: string; onChange: (c: string) => void }) => {
    return <div data-testid="mock-hex-color-picker" data-color={color} />;
  },
  HexColorInput: (props: Record<string, unknown>) => {
    const { color, onChange, ...rest } = props as {
      color: string;
      onChange: (c: string) => void;
      [key: string]: unknown;
    };
    return (
      <input
        {...rest}
        value={color}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    );
  },
}));

describe("ColorPicker", () => {
  describe("when rendered", () => {
    it("then shows all preset color swatches", () => {
      render(<ColorPicker index={0} onSelectColor={vi.fn()} />);
      for (const color of TAILWIND_300_COLORS) {
        expect(screen.getByTestId(`colorOption-${color}`)).toBeInTheDocument();
      }
    });

    it("then uses the index in its test id", () => {
      render(<ColorPicker index={2} onSelectColor={vi.fn()} />);
      expect(screen.getByTestId("colorPicker-2")).toBeInTheDocument();
    });
  });

  describe("when a preset color is clicked", () => {
    it("then calls onSelectColor with that color", () => {
      const onSelectColor = vi.fn();
      render(<ColorPicker index={0} onSelectColor={onSelectColor} />);
      fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[3]}`));
      expect(onSelectColor).toHaveBeenCalledWith(TAILWIND_300_COLORS[3]);
    });
  });

  describe("custom colors", () => {
    const customColors = ["#ff0000", "#00ff00"];

    describe("when custom colors are provided", () => {
      it("then shows the custom color swatches", () => {
        render(<ColorPicker index={0} onSelectColor={vi.fn()} customColors={customColors} />);
        expect(screen.getByTestId("customColor-#ff0000")).toBeInTheDocument();
        expect(screen.getByTestId("customColor-#00ff00")).toBeInTheDocument();
      });

      it("then shows the custom section separator", () => {
        render(<ColorPicker index={0} onSelectColor={vi.fn()} customColors={customColors} />);
        expect(screen.getByTestId("customColorSeparator-0")).toBeInTheDocument();
      });
    });

    describe("when a custom color is clicked", () => {
      it("then calls onSelectColor with that color", () => {
        const onSelectColor = vi.fn();
        render(<ColorPicker index={0} onSelectColor={onSelectColor} customColors={customColors} />);
        fireEvent.click(screen.getByTestId("customColor-#ff0000"));
        expect(onSelectColor).toHaveBeenCalledWith("#ff0000");
      });
    });

    describe("when onAddCustomColor is provided", () => {
      it("then shows the add custom color button", () => {
        render(<ColorPicker index={0} onSelectColor={vi.fn()} onAddCustomColor={vi.fn()} />);
        expect(screen.getByTestId("addCustomColor-0")).toBeInTheDocument();
      });
    });

    describe("when onAddCustomColor is not provided", () => {
      it("then does not show the add custom color button", () => {
        render(<ColorPicker index={0} onSelectColor={vi.fn()} customColors={customColors} />);
        expect(screen.queryByTestId("addCustomColor-0")).not.toBeInTheDocument();
      });
    });

    describe("when the add button is clicked and a color is confirmed", () => {
      it("then calls onAddCustomColor and onSelectColor with the entered color", () => {
        const onAddCustomColor = vi.fn();
        const onSelectColor = vi.fn();
        render(
          <ColorPicker
            index={0}
            onSelectColor={onSelectColor}
            onAddCustomColor={onAddCustomColor}
          />,
        );
        fireEvent.click(screen.getByTestId("addCustomColor-0"));
        expect(screen.getByTestId("advancedPicker-0")).toBeInTheDocument();

        const hexInput = screen.getByTestId("hexInput-0");
        fireEvent.change(hexInput, { target: { value: "#abcdef" } });

        fireEvent.click(screen.getByTestId("confirmColor-0"));
        expect(onSelectColor).toHaveBeenCalledWith("#abcdef");
        expect(onAddCustomColor).toHaveBeenCalledWith("#abcdef");
      });
    });

    describe("when onRemoveCustomColor is provided", () => {
      it("then shows remove buttons on custom color swatches", () => {
        render(
          <ColorPicker
            index={0}
            onSelectColor={vi.fn()}
            customColors={customColors}
            onRemoveCustomColor={vi.fn()}
          />,
        );
        expect(screen.getByTestId("removeCustomColor-#ff0000")).toBeInTheDocument();
        expect(screen.getByTestId("removeCustomColor-#00ff00")).toBeInTheDocument();
      });
    });

    describe("when a custom color remove button is clicked", () => {
      it("then calls onRemoveCustomColor with that color", () => {
        const onRemoveCustomColor = vi.fn();
        render(
          <ColorPicker
            index={0}
            onSelectColor={vi.fn()}
            customColors={customColors}
            onRemoveCustomColor={onRemoveCustomColor}
          />,
        );
        fireEvent.click(screen.getByTestId("removeCustomColor-#ff0000"));
        expect(onRemoveCustomColor).toHaveBeenCalledWith("#ff0000");
      });
    });

    describe("when no custom colors and no callback are provided", () => {
      it("then does not show the custom section", () => {
        render(<ColorPicker index={0} onSelectColor={vi.fn()} />);
        expect(screen.queryByTestId("customColorSeparator-0")).not.toBeInTheDocument();
      });
    });
  });

  describe("advanced picker", () => {
    describe("when the add button is toggled", () => {
      it("then opens and closes the advanced picker", () => {
        render(<ColorPicker index={0} onSelectColor={vi.fn()} onAddCustomColor={vi.fn()} />);
        expect(screen.queryByTestId("advancedPicker-0")).not.toBeInTheDocument();

        fireEvent.click(screen.getByTestId("addCustomColor-0"));
        expect(screen.getByTestId("advancedPicker-0")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("addCustomColor-0"));
        expect(screen.queryByTestId("advancedPicker-0")).not.toBeInTheDocument();
      });
    });

    describe("when a hex value is typed", () => {
      it("then updates the color preview without calling onSelectColor", () => {
        const onSelectColor = vi.fn();
        render(<ColorPicker index={0} onSelectColor={onSelectColor} onAddCustomColor={vi.fn()} />);
        fireEvent.click(screen.getByTestId("addCustomColor-0"));

        const hexInput = screen.getByTestId("hexInput-0");
        fireEvent.change(hexInput, { target: { value: "#ff5733" } });

        expect(onSelectColor).not.toHaveBeenCalled();
        expect(screen.getByTestId("pickerPreview-0")).toHaveStyle({ backgroundColor: "#ff5733" });
      });
    });

    describe("when an RGB value is changed", () => {
      it("then updates the color preview without calling onSelectColor", () => {
        const onSelectColor = vi.fn();
        render(<ColorPicker index={0} onSelectColor={onSelectColor} onAddCustomColor={vi.fn()} />);
        fireEvent.click(screen.getByTestId("addCustomColor-0"));

        fireEvent.change(screen.getByTestId("rgbInput-r-0"), { target: { value: "128" } });

        expect(onSelectColor).not.toHaveBeenCalled();
        expect(screen.getByTestId("pickerPreview-0")).toHaveStyle({ backgroundColor: "#800000" });
      });
    });

    describe("when the confirm button is clicked", () => {
      it("then calls onAddCustomColor and closes the picker", () => {
        const onAddCustomColor = vi.fn();
        render(
          <ColorPicker index={0} onSelectColor={vi.fn()} onAddCustomColor={onAddCustomColor} />,
        );
        fireEvent.click(screen.getByTestId("addCustomColor-0"));
        expect(screen.getByTestId("advancedPicker-0")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("confirmColor-0"));
        expect(onAddCustomColor).toHaveBeenCalledWith("#000000");
        expect(screen.queryByTestId("advancedPicker-0")).not.toBeInTheDocument();
      });
    });
  });
});
