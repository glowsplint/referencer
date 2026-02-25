import { describe, it, expect } from "vitest";
import { isEditableElement } from "./dom";

describe("isEditableElement", () => {
  describe("when target is an input element", () => {
    it("returns true", () => {
      const input = document.createElement("input");
      expect(isEditableElement(input)).toBe(true);
    });
  });

  describe("when target is a textarea element", () => {
    it("returns true", () => {
      const textarea = document.createElement("textarea");
      expect(isEditableElement(textarea)).toBe(true);
    });
  });

  describe("when target is a contenteditable element", () => {
    it("returns true", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      expect(isEditableElement(div)).toBe(true);
    });
  });

  describe("when target is a regular div", () => {
    it("returns false", () => {
      const div = document.createElement("div");
      expect(isEditableElement(div)).toBe(false);
    });
  });

  describe("when target is a button", () => {
    it("returns false", () => {
      const button = document.createElement("button");
      expect(isEditableElement(button)).toBe(false);
    });
  });

  describe("when target is null", () => {
    it("returns false", () => {
      expect(isEditableElement(null)).toBe(false);
    });
  });

  describe("when target is a span", () => {
    it("returns false", () => {
      const span = document.createElement("span");
      expect(isEditableElement(span)).toBe(false);
    });
  });

  describe("when contentEditable is 'false'", () => {
    it("returns false", () => {
      const div = document.createElement("div");
      div.contentEditable = "false";
      expect(isEditableElement(div)).toBe(false);
    });
  });
});
