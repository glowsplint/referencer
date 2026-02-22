import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TitleBar } from "./TitleBar";
import { renderWithWorkspace } from "@/test/render-with-workspace";

function renderTitleBar(overrides = {}) {
  return renderWithWorkspace(<TitleBar />, overrides);
}

describe("TitleBar", () => {
  it("renders share button", () => {
    renderTitleBar();
    expect(screen.getByTestId("shareButton")).toBeInTheDocument();
  });

  it("opens share dialog when share button is clicked", () => {
    renderTitleBar();
    fireEvent.click(screen.getByTestId("shareButton"));
    expect(screen.getByTestId("shareDialog")).toBeInTheDocument();
  });

  it("renders title text", () => {
    renderTitleBar();
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("does not allow editing title when readOnly", () => {
    renderTitleBar({ readOnly: true });
    fireEvent.click(screen.getByText("Title"));
    // Should not enter editing mode - no input should appear
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("allows editing title when not readOnly", () => {
    renderTitleBar({ readOnly: false });
    fireEvent.click(screen.getByText("Title"));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
