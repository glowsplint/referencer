import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextHeader } from "./TextHeader";

describe("TextHeader", () => {
  describe("when rendered", () => {
    it("then shows the text name", () => {
      render(<TextHeader name="Genesis 1" index={0} onUpdateName={vi.fn()} />);
      expect(screen.getByTestId("textHeader-0")).toHaveTextContent("Genesis 1");
    });
  });

  describe("when double-clicked", () => {
    it("then enters edit mode with the current name", async () => {
      const user = userEvent.setup();
      render(<TextHeader name="Genesis 1" index={0} onUpdateName={vi.fn()} />);

      await user.dblClick(screen.getByTestId("textHeader-0"));

      expect(screen.getByTestId("textHeaderInput-0")).toBeInTheDocument();
      expect(screen.getByTestId("textHeaderInput-0")).toHaveValue("Genesis 1");
    });
  });

  describe("when the input loses focus", () => {
    it("then calls onUpdateName with the new value", async () => {
      const user = userEvent.setup();
      const onUpdateName = vi.fn();
      render(
        <div>
          <TextHeader name="Genesis 1" index={0} onUpdateName={onUpdateName} />
          <button>other</button>
        </div>,
      );

      await user.dblClick(screen.getByTestId("textHeader-0"));

      const input = screen.getByTestId("textHeaderInput-0");
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
      render(<TextHeader name="Genesis 1" index={0} onUpdateName={onUpdateName} />);

      await user.dblClick(screen.getByTestId("textHeader-0"));

      const input = screen.getByTestId("textHeaderInput-0");
      await user.clear(input);
      await user.type(input, "Exodus 2{Enter}");

      expect(onUpdateName).toHaveBeenCalledWith("Exodus 2");
    });
  });

  describe("when Escape is pressed during rename", () => {
    it("then cancels editing without calling onUpdateName", async () => {
      const user = userEvent.setup();
      const onUpdateName = vi.fn();
      render(<TextHeader name="Genesis 1" index={0} onUpdateName={onUpdateName} />);

      await user.dblClick(screen.getByTestId("textHeader-0"));

      const input = screen.getByTestId("textHeaderInput-0");
      await user.clear(input);
      await user.type(input, "Should Not Save");
      await user.keyboard("{Escape}");

      expect(onUpdateName).not.toHaveBeenCalled();
      expect(screen.getByTestId("textHeader-0")).toHaveTextContent("Genesis 1");
    });
  });
});
