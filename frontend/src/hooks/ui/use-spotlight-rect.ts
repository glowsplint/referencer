// Computes and tracks the bounding rect of a DOM element matched by a CSS
// selector, with 8px padding. Updates on resize (ResizeObserver) and scroll.
import { useState, useEffect, useCallback } from "react";

const PADDING = 8;

function padRect(rect: DOMRect): DOMRect {
  return new DOMRect(
    rect.x - PADDING,
    rect.y - PADDING,
    rect.width + PADDING * 2,
    rect.height + PADDING * 2,
  );
}

export function useSpotlightRect(selector: string | null): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);

  const update = useCallback((el: Element) => {
    setRect(padRect(el.getBoundingClientRect()));
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

    // Track resize
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => update(el));
    });
    ro.observe(el);

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
