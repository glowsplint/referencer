import { render, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AnnotationCard } from "./AnnotationCard";

function createProps(overrides: Partial<Parameters<typeof AnnotationCard>[0]> = {}) {
  return {
    layerId: "layer-1",
    highlightId: "h1",
    color: "#fca5a5",
    annotation: "",
    isEditing: false,
    top: 40,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    onClick: vi.fn(),
    ...overrides,
  };
}

describe("AnnotationCard", () => {
  it("calls onBlur with layerId, highlightId, and annotation on textarea blur", () => {
    const onBlur = vi.fn();
    const { getByPlaceholderText } = render(
      <AnnotationCard {...createProps({ isEditing: true, annotation: "my note", onBlur })} />,
    );

    fireEvent.blur(getByPlaceholderText("Add annotation..."));

    expect(onBlur).toHaveBeenCalledWith("layer-1", "h1", "my note");
  });

  it("calls onBlur with empty annotation when nothing was typed", () => {
    const onBlur = vi.fn();
    const { getByPlaceholderText } = render(
      <AnnotationCard {...createProps({ isEditing: true, annotation: "", onBlur })} />,
    );

    fireEvent.blur(getByPlaceholderText("Add annotation..."));

    expect(onBlur).toHaveBeenCalledWith("layer-1", "h1", "");
  });

  it("calls onBlur on Enter key (without Shift)", () => {
    const onBlur = vi.fn();
    const { getByPlaceholderText } = render(
      <AnnotationCard {...createProps({ isEditing: true, annotation: "test", onBlur })} />,
    );

    fireEvent.keyDown(getByPlaceholderText("Add annotation..."), { key: "Enter" });

    expect(onBlur).toHaveBeenCalledWith("layer-1", "h1", "test");
  });

  it("does not call onBlur on Shift+Enter", () => {
    const onBlur = vi.fn();
    const { getByPlaceholderText } = render(
      <AnnotationCard {...createProps({ isEditing: true, annotation: "test", onBlur })} />,
    );

    fireEvent.keyDown(getByPlaceholderText("Add annotation..."), {
      key: "Enter",
      shiftKey: true,
    });

    expect(onBlur).not.toHaveBeenCalled();
  });

  it("calls onClick when clicked in non-editing mode", () => {
    const onClick = vi.fn();
    const { getByText } = render(
      <AnnotationCard {...createProps({ annotation: "note", onClick })} />,
    );

    fireEvent.click(getByText("note"));

    expect(onClick).toHaveBeenCalledWith("layer-1", "h1");
  });

  it("blurs textarea on Escape key", () => {
    const onBlur = vi.fn();
    const { getByPlaceholderText } = render(
      <AnnotationCard {...createProps({ isEditing: true, annotation: "test", onBlur })} />,
    );

    const textarea = getByPlaceholderText("Add annotation...");
    fireEvent.keyDown(textarea, { key: "Escape" });

    expect(onBlur).toHaveBeenCalledWith("layer-1", "h1", "test");
  });

  it("auto-resizes textarea to fit content", () => {
    const onChange = vi.fn();
    const { getByPlaceholderText } = render(
      <AnnotationCard {...createProps({ isEditing: true, annotation: "", onChange })} />,
    );

    const textarea = getByPlaceholderText("Add annotation...") as HTMLTextAreaElement;
    expect(textarea.style.height).toBeTruthy();
    expect(textarea.classList.contains("overflow-hidden")).toBe(true);
  });

  it("shows placeholder text when annotation is empty and not editing", () => {
    const { getByText } = render(<AnnotationCard {...createProps({ annotation: "" })} />);

    expect(getByText("Add annotation...")).toBeTruthy();
  });
});
