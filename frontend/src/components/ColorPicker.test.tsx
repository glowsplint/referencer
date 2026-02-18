import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ColorPicker } from "./ColorPicker"
import { TAILWIND_300_COLORS } from "@/types/editor"

// Mock react-colorful: HexColorPicker is canvas-based (no DOM in jsdom),
// and HexColorInput needs to behave as a controlled input with onChange.
vi.mock("react-colorful", () => ({
  HexColorPicker: ({ color }: { color: string; onChange: (c: string) => void }) => {
    return <div data-testid="mock-hex-color-picker" data-color={color} />
  },
  HexColorInput: (props: Record<string, unknown>) => {
    const { color, onChange, ...rest } = props as {
      color: string
      onChange: (c: string) => void
      [key: string]: unknown
    }
    return (
      <input
        {...rest}
        value={color}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    )
  },
}))

describe("ColorPicker", () => {
  it("renders all preset colour options", () => {
    render(
      <ColorPicker index={0} onSelectColor={vi.fn()} />
    )
    for (const color of TAILWIND_300_COLORS) {
      expect(screen.getByTestId(`colorOption-${color}`)).toBeInTheDocument()
    }
  })

  it("calls onSelectColor when a preset colour is clicked", () => {
    const onSelectColor = vi.fn()
    render(
      <ColorPicker index={0} onSelectColor={onSelectColor} />
    )
    fireEvent.click(screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[3]}`))
    expect(onSelectColor).toHaveBeenCalledWith(TAILWIND_300_COLORS[3])
  })

  it("renders with correct test id based on index", () => {
    render(
      <ColorPicker index={2} onSelectColor={vi.fn()} />
    )
    expect(screen.getByTestId("colorPicker-2")).toBeInTheDocument()
  })

  it("applies correct styles to colour buttons", () => {
    render(
      <ColorPicker index={0} onSelectColor={vi.fn()} />
    )
    const btn = screen.getByTestId(`colorOption-${TAILWIND_300_COLORS[0]}`)
    expect(btn).toHaveClass("rounded-full")
    expect(btn).toHaveClass("hover:scale-110")
  })

  describe("custom colors", () => {
    const customColors = ["#ff0000", "#00ff00"]

    it("renders custom color swatches when provided", () => {
      render(
        <ColorPicker index={0} onSelectColor={vi.fn()} customColors={customColors} />
      )
      expect(screen.getByTestId("customColor-#ff0000")).toBeInTheDocument()
      expect(screen.getByTestId("customColor-#00ff00")).toBeInTheDocument()
    })

    it("calls onSelectColor when a custom color is clicked", () => {
      const onSelectColor = vi.fn()
      render(
        <ColorPicker index={0} onSelectColor={onSelectColor} customColors={customColors} />
      )
      fireEvent.click(screen.getByTestId("customColor-#ff0000"))
      expect(onSelectColor).toHaveBeenCalledWith("#ff0000")
    })

    it("renders add button when onAddCustomColor is provided", () => {
      render(
        <ColorPicker index={0} onSelectColor={vi.fn()} onAddCustomColor={vi.fn()} />
      )
      expect(screen.getByTestId("addCustomColor-0")).toBeInTheDocument()
    })

    it("does not render add button when onAddCustomColor is not provided", () => {
      render(
        <ColorPicker index={0} onSelectColor={vi.fn()} customColors={customColors} />
      )
      expect(screen.queryByTestId("addCustomColor-0")).not.toBeInTheDocument()
    })

    it("calls onAddCustomColor via the advanced picker confirm flow", () => {
      const onAddCustomColor = vi.fn()
      const onSelectColor = vi.fn()
      render(
        <ColorPicker index={0} onSelectColor={onSelectColor} onAddCustomColor={onAddCustomColor} />
      )
      // Open the advanced picker
      fireEvent.click(screen.getByTestId("addCustomColor-0"))
      expect(screen.getByTestId("advancedPicker-0")).toBeInTheDocument()

      // Type a hex color into the hex input
      const hexInput = screen.getByTestId("hexInput-0")
      fireEvent.change(hexInput, { target: { value: "#abcdef" } })

      // Click the confirm button — this is when onSelectColor and onAddCustomColor fire
      fireEvent.click(screen.getByTestId("confirmColor-0"))
      expect(onSelectColor).toHaveBeenCalledWith("#abcdef")
      expect(onAddCustomColor).toHaveBeenCalledWith("#abcdef")
    })

    it("renders remove button on custom color swatch", () => {
      render(
        <ColorPicker
          index={0}
          onSelectColor={vi.fn()}
          customColors={customColors}
          onRemoveCustomColor={vi.fn()}
        />
      )
      expect(screen.getByTestId("removeCustomColor-#ff0000")).toBeInTheDocument()
      expect(screen.getByTestId("removeCustomColor-#00ff00")).toBeInTheDocument()
    })

    it("calls onRemoveCustomColor when remove button is clicked", () => {
      const onRemoveCustomColor = vi.fn()
      render(
        <ColorPicker
          index={0}
          onSelectColor={vi.fn()}
          customColors={customColors}
          onRemoveCustomColor={onRemoveCustomColor}
        />
      )
      fireEvent.click(screen.getByTestId("removeCustomColor-#ff0000"))
      expect(onRemoveCustomColor).toHaveBeenCalledWith("#ff0000")
    })

    it("does not render custom section when no colors and no callback", () => {
      render(
        <ColorPicker index={0} onSelectColor={vi.fn()} />
      )
      expect(screen.queryByTestId("customColorSeparator-0")).not.toBeInTheDocument()
    })

    it("shows separator when custom section is visible", () => {
      render(
        <ColorPicker index={0} onSelectColor={vi.fn()} customColors={customColors} />
      )
      expect(screen.getByTestId("customColorSeparator-0")).toBeInTheDocument()
    })
  })

  describe("advanced picker", () => {
    it("toggles advanced picker open and closed", () => {
      render(
        <ColorPicker index={0} onSelectColor={vi.fn()} onAddCustomColor={vi.fn()} />
      )
      // Initially closed
      expect(screen.queryByTestId("advancedPicker-0")).not.toBeInTheDocument()

      // Click to open
      fireEvent.click(screen.getByTestId("addCustomColor-0"))
      expect(screen.getByTestId("advancedPicker-0")).toBeInTheDocument()

      // Click again to close
      fireEvent.click(screen.getByTestId("addCustomColor-0"))
      expect(screen.queryByTestId("advancedPicker-0")).not.toBeInTheDocument()
    })

    it("updates color preview via hex input without calling onSelectColor", () => {
      const onSelectColor = vi.fn()
      render(
        <ColorPicker index={0} onSelectColor={onSelectColor} onAddCustomColor={vi.fn()} />
      )
      fireEvent.click(screen.getByTestId("addCustomColor-0"))

      const hexInput = screen.getByTestId("hexInput-0")
      fireEvent.change(hexInput, { target: { value: "#ff5733" } })

      // onSelectColor should NOT be called until confirm
      expect(onSelectColor).not.toHaveBeenCalled()
      // Preview swatch should reflect the new color
      expect(screen.getByTestId("pickerPreview-0")).toHaveStyle({ backgroundColor: "#ff5733" })
    })

    it("updates color preview via RGB inputs without calling onSelectColor", () => {
      const onSelectColor = vi.fn()
      render(
        <ColorPicker index={0} onSelectColor={onSelectColor} onAddCustomColor={vi.fn()} />
      )
      fireEvent.click(screen.getByTestId("addCustomColor-0"))

      fireEvent.change(screen.getByTestId("rgbInput-r-0"), { target: { value: "128" } })

      // onSelectColor should NOT be called until confirm
      expect(onSelectColor).not.toHaveBeenCalled()
      // Preview should reflect the change
      expect(screen.getByTestId("pickerPreview-0")).toHaveStyle({ backgroundColor: "#800000" })
    })

    it("confirm button calls onAddCustomColor and closes picker", () => {
      const onAddCustomColor = vi.fn()
      render(
        <ColorPicker index={0} onSelectColor={vi.fn()} onAddCustomColor={onAddCustomColor} />
      )
      // Open picker
      fireEvent.click(screen.getByTestId("addCustomColor-0"))
      expect(screen.getByTestId("advancedPicker-0")).toBeInTheDocument()

      // Click confirm
      fireEvent.click(screen.getByTestId("confirmColor-0"))
      expect(onAddCustomColor).toHaveBeenCalledWith("#000000")
      expect(screen.queryByTestId("advancedPicker-0")).not.toBeInTheDocument()
    })
  })
})
