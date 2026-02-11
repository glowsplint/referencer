import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SwitchingButtonIcon } from "./SwitchingButtonIcon"

describe("SwitchingButtonIcon", () => {
  const iconOne = <span data-testid="icon-one">A</span>
  const iconTwo = <span data-testid="icon-two">B</span>

  it("renders iconOne when bool is false", () => {
    render(
      <SwitchingButtonIcon iconOne={iconOne} iconTwo={iconTwo} bool={false} callback={() => {}} />
    )
    expect(screen.getByTestId("icon-one")).toBeInTheDocument()
    expect(screen.queryByTestId("icon-two")).not.toBeInTheDocument()
  })

  it("renders iconTwo when bool is true", () => {
    render(
      <SwitchingButtonIcon iconOne={iconOne} iconTwo={iconTwo} bool={true} callback={() => {}} />
    )
    expect(screen.getByTestId("icon-two")).toBeInTheDocument()
    expect(screen.queryByTestId("icon-one")).not.toBeInTheDocument()
  })

  it("calls callback on click", () => {
    const cb = vi.fn()
    render(
      <SwitchingButtonIcon iconOne={iconOne} iconTwo={iconTwo} bool={false} callback={cb} />
    )
    fireEvent.click(screen.getByRole("button"))
    expect(cb).toHaveBeenCalledOnce()
  })

  it("renders title when provided", () => {
    render(
      <SwitchingButtonIcon
        iconOne={iconOne}
        iconTwo={iconTwo}
        bool={false}
        callback={() => {}}
        title="Toggle"
      />
    )
    expect(screen.getByTitle("Toggle")).toBeInTheDocument()
  })

  it("spreads buttonProps onto the button", () => {
    render(
      <SwitchingButtonIcon
        iconOne={iconOne}
        iconTwo={iconTwo}
        bool={false}
        callback={() => {}}
        buttonProps={{ "data-testid": "custom-btn" }}
      />
    )
    expect(screen.getByTestId("custom-btn")).toBeInTheDocument()
  })
})
