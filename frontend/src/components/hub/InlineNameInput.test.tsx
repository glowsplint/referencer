import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InlineNameInput } from "./InlineNameInput";

function renderInput(overrides: Partial<Parameters<typeof InlineNameInput>[0]> = {}) {
  const props = {
    onSave: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<InlineNameInput {...props} />);
  return props;
}

describe("InlineNameInput", () => {
  describe("when rendered", () => {
    it("shows an input with the default value", () => {
      renderInput({ defaultValue: "My Folder" });
      expect(screen.getByTestId("inlineNameInput")).toHaveValue("My Folder");
    });

    it("shows an empty input when no default value is provided", () => {
      renderInput();
      expect(screen.getByTestId("inlineNameInput")).toHaveValue("");
    });

    it("uses the placeholder prop", () => {
      renderInput({ placeholder: "Type here" });
      expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
    });
  });

  describe("when Enter is pressed with a non-empty value", () => {
    it("calls onSave with the trimmed value", () => {
      const props = renderInput({ defaultValue: "  Test Name  " });
      fireEvent.keyDown(screen.getByTestId("inlineNameInput"), { key: "Enter" });
      expect(props.onSave).toHaveBeenCalledWith("Test Name");
    });
  });

  describe("when Enter is pressed with an empty value", () => {
    it("calls onCancel instead of onSave", () => {
      const props = renderInput({ defaultValue: "" });
      fireEvent.keyDown(screen.getByTestId("inlineNameInput"), { key: "Enter" });
      expect(props.onCancel).toHaveBeenCalledOnce();
      expect(props.onSave).not.toHaveBeenCalled();
    });
  });

  describe("when Escape is pressed", () => {
    it("calls onCancel", () => {
      const props = renderInput({ defaultValue: "Folder" });
      fireEvent.keyDown(screen.getByTestId("inlineNameInput"), { key: "Escape" });
      expect(props.onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("when the input loses focus with a non-empty value", () => {
    it("calls onSave with the trimmed value", () => {
      const props = renderInput({ defaultValue: "Blur Test" });
      fireEvent.blur(screen.getByTestId("inlineNameInput"));
      expect(props.onSave).toHaveBeenCalledWith("Blur Test");
    });
  });

  describe("when the input loses focus with an empty value", () => {
    it("calls onCancel", () => {
      const props = renderInput({ defaultValue: "" });
      fireEvent.blur(screen.getByTestId("inlineNameInput"));
      expect(props.onCancel).toHaveBeenCalledOnce();
    });
  });

  describe("when the user types in the input", () => {
    it("updates the input value", () => {
      renderInput();
      const input = screen.getByTestId("inlineNameInput");
      fireEvent.change(input, { target: { value: "New Name" } });
      expect(input).toHaveValue("New Name");
    });
  });
});
