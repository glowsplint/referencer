import { describe, it, expect } from "vitest";
import { scrollToKeepInView } from "./use-selection-decoration";

function createWrapper(opts: {
  scrollTop?: number;
  scrollLeft?: number;
  clientHeight?: number;
  clientWidth?: number;
}) {
  const el = document.createElement("div");
  el.scrollTop = opts.scrollTop ?? 0;
  el.scrollLeft = opts.scrollLeft ?? 0;
  Object.defineProperty(el, "clientHeight", {
    value: opts.clientHeight ?? 500,
    configurable: true,
  });
  Object.defineProperty(el, "clientWidth", {
    value: opts.clientWidth ?? 800,
    configurable: true,
  });
  return el;
}

describe("scrollToKeepInView", () => {
  describe("vertical scrolling", () => {
    it("scrolls down when word is below visible area", () => {
      const wrapper = createWrapper({ scrollTop: 0, clientHeight: 500 });
      scrollToKeepInView(wrapper, 600, 100, 20, 50, 40);
      // word bottom = 620, visible bottom = 500 - 40 = 460
      // new scrollTop = 620 - 500 + 40 = 160
      expect(wrapper.scrollTop).toBe(160);
    });

    it("scrolls up when word is above visible area", () => {
      const wrapper = createWrapper({ scrollTop: 300, clientHeight: 500 });
      scrollToKeepInView(wrapper, 200, 100, 20, 50, 40);
      // word top = 200, visible top = 300 + 40 = 340
      // new scrollTop = max(0, 200 - 40) = 160
      expect(wrapper.scrollTop).toBe(160);
    });

    it("does not scroll when word is within visible area", () => {
      const wrapper = createWrapper({ scrollTop: 100, clientHeight: 500 });
      scrollToKeepInView(wrapper, 300, 100, 20, 50, 40);
      expect(wrapper.scrollTop).toBe(100);
    });

    it("clamps scrollTop to 0 when word is near the top", () => {
      const wrapper = createWrapper({ scrollTop: 50, clientHeight: 500 });
      scrollToKeepInView(wrapper, 10, 100, 20, 50, 40);
      // max(0, 10 - 40) = 0
      expect(wrapper.scrollTop).toBe(0);
    });
  });

  describe("horizontal scrolling", () => {
    it("scrolls right when word is past the right edge", () => {
      const wrapper = createWrapper({ scrollLeft: 0, clientWidth: 800 });
      scrollToKeepInView(wrapper, 100, 900, 20, 60, 40);
      // word right = 960, visible right = 800 - 40 = 760
      // new scrollLeft = 960 - 800 + 40 = 200
      expect(wrapper.scrollLeft).toBe(200);
    });

    it("scrolls left when word is past the left edge", () => {
      const wrapper = createWrapper({ scrollLeft: 400, clientWidth: 800 });
      scrollToKeepInView(wrapper, 100, 300, 20, 60, 40);
      // word left = 300, visible left = 400 + 40 = 440
      // new scrollLeft = max(0, 300 - 40) = 260
      expect(wrapper.scrollLeft).toBe(260);
    });

    it("does not scroll horizontally when word is visible", () => {
      const wrapper = createWrapper({ scrollLeft: 0, clientWidth: 800 });
      scrollToKeepInView(wrapper, 100, 200, 20, 60, 40);
      expect(wrapper.scrollLeft).toBe(0);
    });
  });
});
