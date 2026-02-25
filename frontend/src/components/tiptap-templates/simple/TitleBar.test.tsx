import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TitleBar } from "./TitleBar";
import { renderWithWorkspace } from "@/test/render-with-workspace";

function renderTitleBar(overrides = {}) {
  return renderWithWorkspace(<TitleBar />, overrides);
}

describe("TitleBar", () => {
  describe("when rendered", () => {
    it("shows the share button", () => {
      renderTitleBar();
      expect(screen.getByTestId("shareButton")).toBeInTheDocument();
    });

    it("shows the title text", () => {
      renderTitleBar();
      expect(screen.getByText("Title")).toBeInTheDocument();
    });
  });

  describe("when the share button is clicked", () => {
    it("opens the share dialog", () => {
      renderTitleBar();
      fireEvent.click(screen.getByTestId("shareButton"));
      expect(screen.getByTestId("shareDialog")).toBeInTheDocument();
    });
  });

  describe("when readOnly is true", () => {
    it("does not enter editing mode on title click", () => {
      renderTitleBar({ readOnly: true });
      fireEvent.click(screen.getByText("Title"));
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  describe("when readOnly is false", () => {
    it("enters editing mode on title click", () => {
      renderTitleBar({ readOnly: false });
      fireEvent.click(screen.getByText("Title"));
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });
  });
});
