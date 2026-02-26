// Computes and tracks the bounding rect of a DOM element matched by a CSS
// selector, with 4px padding. Updates on resize (ResizeObserver) and scroll.
// For elements with `display: contents` (no own box), computes a union rect
// from their direct children.
import { useState, useEffect, useCallback } from "react";

const PADDING = 4;

function padRect(rect: DOMRect): DOMRect {
  return new DOMRect(
    rect.x - PADDING,
    rect.y - PADDING,
    rect.width + PADDING * 2,
    rect.height + PADDING * 2,
  );
}

/** Compute the union bounding rect of an element's direct children. */
function childrenBoundingRect(el: Element): DOMRect {
  let top = Infinity;
  let left = Infinity;
  let bottom = -Infinity;
  let right = -Infinity;
  for (const child of el.children) {
    const r = child.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    top = Math.min(top, r.top);
    left = Math.min(left, r.left);
    bottom = Math.max(bottom, r.bottom);
    right = Math.max(right, r.right);
  }
  if (top === Infinity) return el.getBoundingClientRect();
  return new DOMRect(left, top, right - left, bottom - top);
}

function measureElement(el: Element): DOMRect {
  const style = getComputedStyle(el);
  if (style.display === "contents") {
    return childrenBoundingRect(el);
  }
  return el.getBoundingClientRect();
}

export function useSpotlightRect(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const update = useCallback((el: Element) => {
    setRect(padRect(measureElement(el)));
  }, []);

  useEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }

    // Initial measurement
    update(el);

    // Track resize — observe the element and its children for display:contents
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => update(el));
    });
    ro.observe(el);
    if (getComputedStyle(el).display === "contents") {
      for (const child of el.children) ro.observe(child);
    }

    // Track scroll
    const onScroll = () => {
      requestAnimationFrame(() => update(el));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [selector, update]);

  return rect;
}
