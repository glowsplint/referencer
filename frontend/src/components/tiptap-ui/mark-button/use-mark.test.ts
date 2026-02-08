import { describe, it, expect, vi } from "vitest"
import type { Editor } from "@tiptap/react"
import {
  shouldShowButton,
  canToggleMark,
  isMarkActive,
  getFormattedMarkName,
} from "./use-mark"

vi.mock("@/lib/tiptap-utils", () => ({
  isMarkInSchema: (type: string, editor: { _schemaMarks?: string[] }) => {
    return editor._schemaMarks?.includes(type) ?? true
  },
  isNodeTypeSelected: (editor: { _selectedNode?: string }, types: string[]) => {
    return types.includes(editor._selectedNode ?? "")
  },
}))

function createMockEditor(
  overrides: Record<string, unknown> = {}
): Editor {
  return {
    isEditable: true,
    _schemaMarks: ["bold", "italic", "strike", "code"],
    _selectedNode: "",
    can: () => ({
      toggleMark: () => true,
    }),
    isActive: () => false,
    ...overrides,
  } as unknown as Editor
}

describe("shouldShowButton", () => {
  it("returns false when editor is null", () => {
    expect(
      shouldShowButton({ editor: null, type: "bold", hideWhenUnavailable: false })
    ).toBe(false)
  })

  it("returns false when editor is not editable", () => {
    const editor = createMockEditor({ isEditable: false })
    expect(
      shouldShowButton({ editor, type: "bold", hideWhenUnavailable: false })
    ).toBe(false)
  })

  it("returns false when mark is not in schema", () => {
    const editor = createMockEditor({ _schemaMarks: ["italic"] })
    expect(
      shouldShowButton({ editor, type: "bold", hideWhenUnavailable: false })
    ).toBe(false)
  })

  it("returns true when editable and mark is in schema", () => {
    const editor = createMockEditor()
    expect(
      shouldShowButton({ editor, type: "bold", hideWhenUnavailable: false })
    ).toBe(true)
  })
})

describe("canToggleMark", () => {
  it("returns false when editor is null", () => {
    expect(canToggleMark(null, "bold")).toBe(false)
  })

  it("returns false when editor is not editable", () => {
    const editor = createMockEditor({ isEditable: false })
    expect(canToggleMark(editor, "bold")).toBe(false)
  })

  it("returns false when mark is not in schema", () => {
    const editor = createMockEditor({ _schemaMarks: ["italic"] })
    expect(canToggleMark(editor, "bold")).toBe(false)
  })

  it("returns false when image is selected", () => {
    const editor = createMockEditor({ _selectedNode: "image" })
    expect(canToggleMark(editor, "bold")).toBe(false)
  })

  it("delegates to editor.can().toggleMark()", () => {
    const toggleMarkFn = vi.fn().mockReturnValue(true)
    const editor = createMockEditor({ can: () => ({ toggleMark: toggleMarkFn }) })
    expect(canToggleMark(editor, "bold")).toBe(true)
    expect(toggleMarkFn).toHaveBeenCalledWith("bold")
  })

  it("returns false when editor.can().toggleMark() returns false", () => {
    const editor = createMockEditor({
      can: () => ({ toggleMark: () => false }),
    })
    expect(canToggleMark(editor, "bold")).toBe(false)
  })
})

describe("isMarkActive", () => {
  it("returns false when editor is null", () => {
    expect(isMarkActive(null, "bold")).toBe(false)
  })

  it("returns false when editor is not editable", () => {
    const editor = createMockEditor({ isEditable: false })
    expect(isMarkActive(editor, "bold")).toBe(false)
  })

  it("delegates to editor.isActive()", () => {
    const isActiveFn = vi.fn().mockReturnValue(true)
    const editor = createMockEditor({ isActive: isActiveFn })
    expect(isMarkActive(editor, "italic")).toBe(true)
    expect(isActiveFn).toHaveBeenCalledWith("italic")
  })
})

describe("getFormattedMarkName", () => {
  it("capitalizes first letter", () => {
    expect(getFormattedMarkName("bold")).toBe("Bold")
    expect(getFormattedMarkName("italic")).toBe("Italic")
    expect(getFormattedMarkName("superscript")).toBe("Superscript")
  })
})
