import { describe, it, expect, vi } from "vitest";
import { isMac, formatShortcutKey, parseShortcutKeys } from "./platform";

describe("isMac", () => {
  describe("when navigator.platform contains 'mac'", () => {
    it("returns true", () => {
      vi.stubGlobal("navigator", { platform: "MacIntel" });
      expect(isMac()).toBe(true);
      vi.unstubAllGlobals();
    });
  });

  describe("when navigator.platform is Windows", () => {
    it("returns false", () => {
      vi.stubGlobal("navigator", { platform: "Win32" });
      expect(isMac()).toBe(false);
      vi.unstubAllGlobals();
    });
  });

  describe("when navigator.platform is Linux", () => {
    it("returns false", () => {
      vi.stubGlobal("navigator", { platform: "Linux x86_64" });
      expect(isMac()).toBe(false);
      vi.unstubAllGlobals();
    });
  });
});

describe("formatShortcutKey", () => {
  describe("when on Mac", () => {
    it("converts 'ctrl' to control symbol", () => {
      expect(formatShortcutKey("ctrl", true)).toBe("\u2303");
    });

    it("converts 'alt' to option symbol", () => {
      expect(formatShortcutKey("alt", true)).toBe("\u2325");
    });

    it("converts 'shift' to shift symbol", () => {
      expect(formatShortcutKey("shift", true)).toBe("\u21E7");
    });

    it("converts 'mod' to command symbol", () => {
      expect(formatShortcutKey("mod", true)).toBe("\u2318");
    });

    it("uppercases unknown keys by default", () => {
      expect(formatShortcutKey("a", true)).toBe("A");
    });

    it("preserves case when capitalize is false", () => {
      expect(formatShortcutKey("a", true, false)).toBe("a");
    });
  });

  describe("when not on Mac", () => {
    it("capitalizes first letter of key", () => {
      expect(formatShortcutKey("ctrl", false)).toBe("Ctrl");
    });

    it("capitalizes first letter of 'alt'", () => {
      expect(formatShortcutKey("alt", false)).toBe("Alt");
    });

    it("preserves case when capitalize is false", () => {
      expect(formatShortcutKey("ctrl", false, false)).toBe("ctrl");
    });
  });
});

describe("parseShortcutKeys", () => {
  describe("when shortcutKeys is undefined", () => {
    it("returns empty array", () => {
      expect(parseShortcutKeys({ shortcutKeys: undefined })).toEqual([]);
    });
  });

  describe("when given a single key", () => {
    it("returns array with one formatted key", () => {
      vi.stubGlobal("navigator", { platform: "Win32" });
      const result = parseShortcutKeys({ shortcutKeys: "ctrl" });
      expect(result).toEqual(["Ctrl"]);
      vi.unstubAllGlobals();
    });
  });

  describe("when given multiple keys with + delimiter", () => {
    it("splits and formats each key", () => {
      vi.stubGlobal("navigator", { platform: "Win32" });
      const result = parseShortcutKeys({ shortcutKeys: "ctrl+shift+a" });
      expect(result).toEqual(["Ctrl", "Shift", "A"]);
      vi.unstubAllGlobals();
    });
  });

  describe("when using a custom delimiter", () => {
    it("splits on the custom delimiter", () => {
      vi.stubGlobal("navigator", { platform: "Win32" });
      const result = parseShortcutKeys({
        shortcutKeys: "ctrl-alt-b",
        delimiter: "-",
      });
      expect(result).toEqual(["Ctrl", "Alt", "B"]);
      vi.unstubAllGlobals();
    });
  });

  describe("when capitalize is false", () => {
    it("preserves original casing", () => {
      vi.stubGlobal("navigator", { platform: "Win32" });
      const result = parseShortcutKeys({
        shortcutKeys: "ctrl+a",
        capitalize: false,
      });
      expect(result).toEqual(["ctrl", "a"]);
      vi.unstubAllGlobals();
    });
  });
});
