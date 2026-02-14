import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ArrowStylePicker } from "./ArrowStylePicker"
import { ARROW_STYLES } from "@/lib/arrow-styles"

function renderPicker(overrides = {}) {
  const defaults = {
    index: 0,
    activeStyle: "solid" as const,
    color: "#fca5a5",
    onSelectStyle: vi.fn(),
  }
  const props = { ...defaults, ...overrides }
  return { ...render(<ArrowStylePicker {...props} />), props }
}

describe("ArrowStylePicker", () => {
  it("renders with correct testid", () => {
    renderPicker()
    expect(screen.getByTestId("arrowStylePicker-0")).toBeInTheDocument()
  })

  it("renders all four style options", () => {
    renderPicker()
    for (const style of ARROW_STYLES) {
      expect(screen.getByTestId(`arrowStyleOption-${style.value}`)).toBeInTheDocument()
      expect(screen.getByText(style.label)).toBeInTheDocument()
    }
  })

  it("highlights the active style with bg-accent", () => {
    renderPicker({ activeStyle: "dashed" })
    const dashed = screen.getByTestId("arrowStyleOption-dashed")
    expect(dashed).toHaveClass("bg-accent")
    const solid = screen.getByTestId("arrowStyleOption-solid")
    expect(solid).not.toHaveClass("bg-accent")
  })

  it("calls onSelectStyle when a style is clicked", () => {
    const { props } = renderPicker()
    fireEvent.click(screen.getByTestId("arrowStyleOption-dotted"))
    expect(props.onSelectStyle).toHaveBeenCalledWith("dotted")
  })

  it("calls onSelectStyle with 'double' when double is clicked", () => {
    const { props } = renderPicker()
    fireEvent.click(screen.getByTestId("arrowStyleOption-double"))
    expect(props.onSelectStyle).toHaveBeenCalledWith("double")
  })

  it("uses the provided index in testid", () => {
    renderPicker({ index: 3 })
    expect(screen.getByTestId("arrowStylePicker-3")).toBeInTheDocument()
  })

  it("renders SVG previews for each style", () => {
    const { container } = renderPicker()
    const svgs = container.querySelectorAll("svg")
    expect(svgs.length).toBe(ARROW_STYLES.length)
  })
})
