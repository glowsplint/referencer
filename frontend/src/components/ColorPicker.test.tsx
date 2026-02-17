import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ColorPicker } from "./ColorPicker"
import { TAILWIND_300_COLORS } from "@/types/editor"

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

    it("calls onAddCustomColor and onSelectColor when a color is picked", () => {
      const onAddCustomColor = vi.fn()
      const onSelectColor = vi.fn()
      render(
        <ColorPicker index={0} onSelectColor={onSelectColor} onAddCustomColor={onAddCustomColor} />
      )
      const input = screen.getByTestId("colorInput-0")
      fireEvent.change(input, { target: { value: "#abcdef" } })
      expect(onAddCustomColor).toHaveBeenCalledWith("#abcdef")
      expect(onSelectColor).toHaveBeenCalledWith("#abcdef")
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
})
