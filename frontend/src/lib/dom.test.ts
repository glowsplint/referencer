import { describe, it, expect } from "vitest";
import { isEditableElement } from "./dom";

describe("when using isEditableElement", () => {
  it("then returns true for input elements", () => {
    expect(isEditableElement(document.createElement("input"))).toBe(true);
  });

  it("then returns true for textarea elements", () => {
    expect(isEditableElement(document.createElement("textarea"))).toBe(true);
  });

  it("then returns true for contentEditable elements", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    expect(isEditableElement(div)).toBe(true);
  });

  it("then returns false for div elements", () => {
    expect(isEditableElement(document.createElement("div"))).toBe(false);
  });

  it("then returns false for button elements", () => {
    expect(isEditableElement(document.createElement("button"))).toBe(false);
  });

  it("then returns false for null", () => {
    expect(isEditableElement(null)).toBe(false);
  });
});
