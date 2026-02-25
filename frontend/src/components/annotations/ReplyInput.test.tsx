import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ReplyInput } from "./ReplyInput";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === "annotations.replyPlaceholder") return "Reply...";
      return key;
    },
  }),
}));

vi.mock("@/components/MiniCommentEditor", () => ({
  MiniCommentEditor: ({
    value,
    onChange,
    onBlur,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    onBlur: () => void;
    placeholder: string;
  }) => (
    <input
      data-testid="miniCommentEditor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  ),
}));

function renderReplyInput(overrides: Partial<Parameters<typeof ReplyInput>[0]> = {}) {
  const props = {
    onSubmit: vi.fn(),
    ...overrides,
  };
  render(<ReplyInput {...props} />);
  return props;
}

describe("ReplyInput", () => {
  describe("when rendered in collapsed state", () => {
    it("shows the placeholder text", () => {
      renderReplyInput();
      expect(screen.getByText("Reply...")).toBeInTheDocument();
    });

    it("uses custom placeholder when provided", () => {
      renderReplyInput({ placeholder: "Add a comment..." });
      expect(screen.getByText("Add a comment...")).toBeInTheDocument();
    });
  });

  describe("when the placeholder is clicked", () => {
    it("expands to show the editor and send button", () => {
      renderReplyInput();
      fireEvent.click(screen.getByText("Reply..."));
      expect(screen.getByTestId("miniCommentEditor")).toBeInTheDocument();
      expect(screen.getByTitle("Send reply")).toBeInTheDocument();
    });
  });

  describe("when the send button is clicked with text", () => {
    it("calls onSubmit with the value and resets", () => {
      const props = renderReplyInput();
      fireEvent.click(screen.getByText("Reply..."));
      fireEvent.change(screen.getByTestId("miniCommentEditor"), {
        target: { value: "Hello world" },
      });
      fireEvent.click(screen.getByTitle("Send reply"));
      expect(props.onSubmit).toHaveBeenCalledWith("Hello world");
    });
  });

  describe("when the send button is clicked with empty/tag-only text", () => {
    it("does not call onSubmit", () => {
      const props = renderReplyInput();
      fireEvent.click(screen.getByText("Reply..."));
      // Value is empty string by default
      fireEvent.click(screen.getByTitle("Send reply"));
      expect(props.onSubmit).not.toHaveBeenCalled();
    });
  });
});
