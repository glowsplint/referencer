import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isMac, formatShortcutKey, parseShortcutKeys, MAC_SYMBOLS, SR_ONLY } from "./platform";

describe("MAC_SYMBOLS", () => {
  it("maps mod to command symbol", () => {
    expect(MAC_SYMBOLS["mod"]).toBe("⌘");
  });

  it("maps ctrl to control symbol", () => {
    expect(MAC_SYMBOLS["ctrl"]).toBe("⌃");
  });

  it("maps alt to option symbol", () => {
    expect(MAC_SYMBOLS["alt"]).toBe("⌥");
  });

  it("maps shift to shift symbol", () => {
    expect(MAC_SYMBOLS["shift"]).toBe("⇧");
  });
});

describe("SR_ONLY", () => {
  it("has screen reader only styling properties", () => {
    expect(SR_ONLY.position).toBe("absolute");
    expect(SR_ONLY.width).toBe("1px");
    expect(SR_ONLY.height).toBe("1px");
    expect(SR_ONLY.overflow).toBe("hidden");
  });
});

describe("isMac", () => {
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  it("returns true on macOS", () => {
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      writable: true,
      configurable: true,
    });
    expect(isMac()).toBe(true);
  });

  it("returns false on Windows", () => {
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      writable: true,
      configurable: true,
    });
    expect(isMac()).toBe(false);
  });

  it("returns false on Linux", () => {
    Object.defineProperty(navigator, "platform", {
      value: "Linux x86_64",
      writable: true,
      configurable: true,
    });
    expect(isMac()).toBe(false);
  });
});

describe("formatShortcutKey", () => {
  it("returns Mac symbol for known keys on Mac", () => {
    expect(formatShortcutKey("ctrl", true)).toBe("⌃");
    expect(formatShortcutKey("alt", true)).toBe("⌥");
    expect(formatShortcutKey("shift", true)).toBe("⇧");
    expect(formatShortcutKey("mod", true)).toBe("⌘");
  });

  it("uppercases unknown keys on Mac when capitalize=true", () => {
    expect(formatShortcutKey("k", true)).toBe("K");
  });

  it("returns raw key on Mac when capitalize=false and key not in symbols", () => {
    expect(formatShortcutKey("k", true, false)).toBe("k");
  });

  it("capitalizes first letter on non-Mac", () => {
    expect(formatShortcutKey("ctrl", false)).toBe("Ctrl");
    expect(formatShortcutKey("alt", false)).toBe("Alt");
    expect(formatShortcutKey("shift", false)).toBe("Shift");
  });

  it("returns raw key on non-Mac when capitalize=false", () => {
    expect(formatShortcutKey("ctrl", false, false)).toBe("ctrl");
  });

  it("handles case-insensitive Mac symbol lookup", () => {
    expect(formatShortcutKey("CTRL", true)).toBe("⌃");
    expect(formatShortcutKey("Alt", true)).toBe("⌥");
  });
});

describe("parseShortcutKeys", () => {
  // We need to mock isMac for deterministic results
  const originalPlatform = navigator.platform;

  beforeEach(() => {
    // Set to non-Mac for predictable output
    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      writable: true,
      configurable: true,
    });
  });

  it("returns empty array for undefined shortcutKeys", () => {
    expect(parseShortcutKeys({ shortcutKeys: undefined })).toEqual([]);
  });

  it("splits on + by default and formats keys", () => {
    const result = parseShortcutKeys({ shortcutKeys: "ctrl+shift+k" });
    expect(result).toEqual(["Ctrl", "Shift", "K"]);
  });

  it("supports custom delimiter", () => {
    const result = parseShortcutKeys({ shortcutKeys: "ctrl-shift-k", delimiter: "-" });
    expect(result).toEqual(["Ctrl", "Shift", "K"]);
  });

  it("trims whitespace around keys", () => {
    const result = parseShortcutKeys({ shortcutKeys: "ctrl + k" });
    expect(result).toEqual(["Ctrl", "K"]);
  });

  it("respects capitalize=false", () => {
    const result = parseShortcutKeys({ shortcutKeys: "ctrl+k", capitalize: false });
    expect(result).toEqual(["ctrl", "k"]);
  });

  it("formats with Mac symbols when on Mac", () => {
    Object.defineProperty(navigator, "platform", {
      value: "MacIntel",
      writable: true,
      configurable: true,
    });
    const result = parseShortcutKeys({ shortcutKeys: "ctrl+shift+k" });
    expect(result).toEqual(["⌃", "⇧", "K"]);
  });
});
