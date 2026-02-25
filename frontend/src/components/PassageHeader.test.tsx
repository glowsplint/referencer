import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PassageHeader } from "./PassageHeader";

describe("PassageHeader", () => {
  it("renders the passage name", () => {
    render(<PassageHeader name="Genesis 1" index={0} onUpdateName={vi.fn()} />);
    expect(screen.getByTestId("passageHeader-0")).toHaveTextContent("Genesis 1");
  });

  it("enters edit mode on double click", async () => {
    const user = userEvent.setup();
    render(<PassageHeader name="Genesis 1" index={0} onUpdateName={vi.fn()} />);

    await user.dblClick(screen.getByTestId("passageHeader-0"));

    expect(screen.getByTestId("passageHeaderInput-0")).toBeInTheDocument();
    expect(screen.getByTestId("passageHeaderInput-0")).toHaveValue("Genesis 1");
  });

  it("calls onUpdateName with the new value on blur", async () => {
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

  it("calls onUpdateName on Enter key", async () => {
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
