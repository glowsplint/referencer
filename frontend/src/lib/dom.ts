export function isEditableElement(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLElement && target.contentEditable === "true") return true
  return false
}
