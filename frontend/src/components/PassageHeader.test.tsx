import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassageHeader } from "./PassageHeader";

describe("PassageHeader", () => {
  describe("when rendered", () => {
    it("then shows the passage name", () => {
      render(<PassageHeader name="Genesis 1" index={0} onUpdateName={vi.fn()} />);
      expect(screen.getByTestId("passageHeader-0")).toHaveTextContent("Genesis 1");
    });
  });

  describe("when double-clicked", () => {
    it("then enters edit mode with the current name", async () => {
      const user = userEvent.setup();
      render(<PassageHeader name="Genesis 1" index={0} onUpdateName={vi.fn()} />);

      await user.dblClick(screen.getByTestId("passageHeader-0"));

      expect(screen.getByTestId("passageHeaderInput-0")).toBeInTheDocument();
      expect(screen.getByTestId("passageHeaderInput-0")).toHaveValue("Genesis 1");
    });
  });

  describe("when the input loses focus", () => {
    it("then calls onUpdateName with the new value", async () => {
      const user = userEvent.setup();
      const onUpdateName = vi.fn();
      render(
        <div>
          <PassageHeader name="Genesis 1" index={0} onUpdateName={onUpdateName} />
          <button>other</button>
        </div>,
      );

      await user.dblClick(screen.getByTestId("passageHeader-0"));

      const input = screen.getByTestId("passageHeaderInput-0");
      await user.clear(input);
      await user.type(input, "Exodus 2");
      await user.click(screen.getByText("other"));

      expect(onUpdateName).toHaveBeenCalledWith("Exodus 2");
    });
  });

  describe("when Enter is pressed in the input", () => {
    it("then calls onUpdateName with the new value", async () => {
      const user = userEvent.setup();
      const onUpdateName = vi.fn();
      render(<PassageHeader name="Genesis 1" index={0} onUpdateName={onUpdateName} />);

      await user.dblClick(screen.getByTestId("passageHeader-0"));

      const input = screen.getByTestId("passageHeaderInput-0");
      await user.clear(input);
      await user.type(input, "Exodus 2{Enter}");

      expect(onUpdateName).toHaveBeenCalledWith("Exodus 2");
    });
  });
});
