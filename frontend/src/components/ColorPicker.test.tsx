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

  it("renders custom color swatches when provided", () => {
    render(
      <ColorPicker
        index={0}
        onSelectColor={vi.fn()}
        customColors={["#ff0000", "#00ff00"]}
      />
    )
    expect(screen.getByTestId("customColorOption-#ff0000")).toBeInTheDocument()
    expect(screen.getByTestId("customColorOption-#00ff00")).toBeInTheDocument()
  })

  it("calls onSelectColor when a custom colour is clicked", () => {
    const onSelectColor = vi.fn()
    render(
      <ColorPicker
        index={0}
        onSelectColor={onSelectColor}
        customColors={["#ff0000"]}
      />
    )
    fireEvent.click(screen.getByTestId("customColorOption-#ff0000"))
    expect(onSelectColor).toHaveBeenCalledWith("#ff0000")
  })

  it("renders add custom color button when onAddCustomColor is provided", () => {
    render(
      <ColorPicker
        index={0}
        onSelectColor={vi.fn()}
        onAddCustomColor={vi.fn()}
      />
    )
    expect(screen.getByTestId("addCustomColorButton")).toBeInTheDocument()
  })

  it("does not render add button when onAddCustomColor is not provided", () => {
    render(
      <ColorPicker index={0} onSelectColor={vi.fn()} />
    )
    expect(screen.queryByTestId("addCustomColorButton")).not.toBeInTheDocument()
  })

  it("calls onAddCustomColor and onSelectColor when a custom color is picked", () => {
    const onAddCustomColor = vi.fn()
    const onSelectColor = vi.fn()
    render(
      <ColorPicker
        index={0}
        onSelectColor={onSelectColor}
        onAddCustomColor={onAddCustomColor}
      />
    )
    const input = screen.getByTestId("customColorInput")
    fireEvent.change(input, { target: { value: "#abcdef" } })
    expect(onAddCustomColor).toHaveBeenCalledWith("#abcdef")
    expect(onSelectColor).toHaveBeenCalledWith("#abcdef")
  })

  it("renders remove button for custom colors when onRemoveCustomColor is provided", () => {
    render(
      <ColorPicker
        index={0}
        onSelectColor={vi.fn()}
        customColors={["#ff0000"]}
        onRemoveCustomColor={vi.fn()}
      />
    )
    expect(screen.getByTestId("removeCustomColor-#ff0000")).toBeInTheDocument()
  })

  it("calls onRemoveCustomColor when remove button is clicked", () => {
    const onRemoveCustomColor = vi.fn()
    render(
      <ColorPicker
        index={0}
        onSelectColor={vi.fn()}
        customColors={["#ff0000"]}
        onRemoveCustomColor={onRemoveCustomColor}
      />
    )
    fireEvent.click(screen.getByTestId("removeCustomColor-#ff0000"))
    expect(onRemoveCustomColor).toHaveBeenCalledWith("#ff0000")
  })

  it("does not render custom section when no custom colors and no onAddCustomColor", () => {
    render(
      <ColorPicker index={0} onSelectColor={vi.fn()} />
    )
    expect(screen.queryByTestId("addCustomColorButton")).not.toBeInTheDocument()
    expect(screen.queryByTestId("customColorInput")).not.toBeInTheDocument()
  })
})
