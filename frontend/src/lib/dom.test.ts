import { describe, it, expect } from "vitest";
import { isEditableElement } from "./dom";

describe("isEditableElement", () => {
  it("returns true for input elements", () => {
    expect(isEditableElement(document.createElement("input"))).toBe(true);
  });

  it("returns true for textarea elements", () => {
    expect(isEditableElement(document.createElement("textarea"))).toBe(true);
  });

  it("returns true for contentEditable elements", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    expect(isEditableElement(div)).toBe(true);
  });

  it("returns false for div elements", () => {
    expect(isEditableElement(document.createElement("div"))).toBe(false);
  });

  it("returns false for button elements", () => {
    expect(isEditableElement(document.createElement("button"))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isEditableElement(null)).toBe(false);
  });
});
