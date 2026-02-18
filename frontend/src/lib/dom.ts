// DOM utility for detecting editable elements (inputs, textareas, contenteditable).
// Used to suppress keyboard shortcuts when the user is typing in a form field.

export function isEditableElement(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLElement && target.contentEditable === "true") return true
  return false
}
