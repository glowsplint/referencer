import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ColorPicker } from "./ColorPicker"
import { TAILWIND_300_COLORS } from "@/types/editor"

describe("ColorPicker", () => {
  it("renders all colour options", () => {
    render(
      <ColorPicker index={0} onSelectColor={vi.fn()} />
    )
    for (const color of TAILWIND_300_COLORS) {
      expect(screen.getByTestId(`colorOption-${color}`)).toBeInTheDocument()
    }
  })

  it("calls onSelectColor when a colour is clicked", () => {
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
})
