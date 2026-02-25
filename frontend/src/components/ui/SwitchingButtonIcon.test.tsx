import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SwitchingButtonIcon } from "./SwitchingButtonIcon";

describe("SwitchingButtonIcon", () => {
  const iconOne = <span data-testid="icon-one">A</span>;
  const iconTwo = <span data-testid="icon-two">B</span>;

  describe("when toggled off", () => {
    it("then shows the inactive icon", () => {
      render(
        <SwitchingButtonIcon
          iconOne={iconOne}
          iconTwo={iconTwo}
          bool={false}
          callback={() => {}}
        />,
      );
      expect(screen.getByTestId("icon-one")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-two")).not.toBeInTheDocument();
    });
  });

  describe("when toggled on", () => {
    it("then shows the active icon", () => {
      render(
        <SwitchingButtonIcon iconOne={iconOne} iconTwo={iconTwo} bool={true} callback={() => {}} />,
      );
      expect(screen.getByTestId("icon-two")).toBeInTheDocument();
      expect(screen.queryByTestId("icon-one")).not.toBeInTheDocument();
    });
  });

  describe("when clicked", () => {
    it("then triggers the toggle callback", () => {
      const cb = vi.fn();
      render(
        <SwitchingButtonIcon iconOne={iconOne} iconTwo={iconTwo} bool={false} callback={cb} />,
      );
      fireEvent.click(screen.getByRole("button"));
      expect(cb).toHaveBeenCalledOnce();
    });
  });

  describe("when a title is set", () => {
    it("then shows it as a tooltip", () => {
      render(
        <SwitchingButtonIcon
          iconOne={iconOne}
          iconTwo={iconTwo}
          bool={false}
          callback={() => {}}
          title="Toggle"
        />,
      );
      expect(screen.getByTitle("Toggle")).toBeInTheDocument();
    });
  });

  describe("when extra button props are provided", () => {
    it("then spreads them onto the underlying button element", () => {
      render(
        <SwitchingButtonIcon
          iconOne={iconOne}
          iconTwo={iconTwo}
          bool={false}
          callback={() => {}}
          buttonProps={{ "data-testid": "custom-btn" }}
        />,
      );
      expect(screen.getByTestId("custom-btn")).toBeInTheDocument();
    });
  });
});
