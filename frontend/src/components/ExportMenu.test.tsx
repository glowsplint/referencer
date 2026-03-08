import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ExportMenu } from "./ExportMenu";
import { renderWithDocument } from "@/test/render-with-document";

function renderExportMenu(onExportMarkdown = vi.fn(), onExportCleanText = vi.fn()) {
  return {
    onExportMarkdown,
    onExportCleanText,
    ...renderWithDocument(
      <ExportMenu onExportMarkdown={onExportMarkdown} onExportCleanText={onExportCleanText} />,
    ),
  };
}

describe("ExportMenu", () => {
  it("renders the export menu trigger button", () => {
    renderExportMenu();
    expect(screen.getByTestId("exportMenuButton")).toBeInTheDocument();
  });

  it("shows menu items when clicked", async () => {
    const user = userEvent.setup();
    renderExportMenu();
    await user.click(screen.getByTestId("exportMenuButton"));
    expect(screen.getByTestId("exportPdfButton")).toBeInTheDocument();
    expect(screen.getByTestId("exportMarkdownButton")).toBeInTheDocument();
    expect(screen.getByTestId("exportCleanTextButton")).toBeInTheDocument();
  });

  it("calls window.print when PDF item is clicked", async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    renderExportMenu();
    await user.click(screen.getByTestId("exportMenuButton"));
    await user.click(screen.getByTestId("exportPdfButton"));
    expect(printSpy).toHaveBeenCalledOnce();
    printSpy.mockRestore();
  });

  it("calls onExportMarkdown when Markdown item is clicked", async () => {
    const user = userEvent.setup();
    const onExportMarkdown = vi.fn();
    renderExportMenu(onExportMarkdown);
    await user.click(screen.getByTestId("exportMenuButton"));
    await user.click(screen.getByTestId("exportMarkdownButton"));
    expect(onExportMarkdown).toHaveBeenCalledOnce();
  });

  it("calls onExportCleanText when clean text item is clicked", async () => {
    const user = userEvent.setup();
    const onExportMarkdown = vi.fn();
    const onExportCleanText = vi.fn();
    renderExportMenu(onExportMarkdown, onExportCleanText);
    await user.click(screen.getByTestId("exportMenuButton"));
    await user.click(screen.getByTestId("exportCleanTextButton"));
    expect(onExportCleanText).toHaveBeenCalledOnce();
  });
});
