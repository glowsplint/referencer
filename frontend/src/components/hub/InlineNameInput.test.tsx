import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineNameInput } from "./InlineNameInput";

describe("InlineNameInput", () => {
  it("renders with default value and focuses automatically", () => {
    render(<InlineNameInput defaultValue="Existing" onSave={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByTestId("inlineNameInput");
    expect(input).toHaveValue("Existing");
    expect(input).toHaveFocus();
  });

  it("calls onSave with trimmed value on Enter", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineNameInput onSave={onSave} onCancel={vi.fn()} />);

    const input = screen.getByTestId("inlineNameInput");
    await user.type(input, "  New Folder  {Enter}");

    expect(onSave).toHaveBeenCalledWith("New Folder");
  });

  it("calls onCancel on Escape", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<InlineNameInput onSave={vi.fn()} onCancel={onCancel} />);

    const input = screen.getByTestId("inlineNameInput");
    await user.type(input, "something");
    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when blurred with empty value", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(
      <div>
        <InlineNameInput onSave={onSave} onCancel={onCancel} />
        <button>other</button>
      </div>,
    );

    const input = screen.getByTestId("inlineNameInput");
    // Input is empty, blur by tabbing out
    await user.click(screen.getByText("other"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onSave when blurred with non-empty value", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <div>
        <InlineNameInput onSave={onSave} onCancel={vi.fn()} />
        <button>other</button>
      </div>,
    );

    const input = screen.getByTestId("inlineNameInput");
    await user.type(input, "My Folder");
    await user.click(screen.getByText("other"));

    expect(onSave).toHaveBeenCalledWith("My Folder");
  });

  it("uses the provided placeholder", () => {
    render(<InlineNameInput onSave={vi.fn()} onCancel={vi.fn()} placeholder="Enter name" />);
    expect(screen.getByPlaceholderText("Enter name")).toBeInTheDocument();
  });
});
