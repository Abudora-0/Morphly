"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ties an element's [data-reveal] entrance (see globals.css) to an
 * IntersectionObserver, so it animates in once scrolled into view rather
 * than on mount. Fires once, then disconnects, since these are one-shot
 * entrances, not looping/retriggering effects.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
