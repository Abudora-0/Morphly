"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/lib/useReveal";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
};

/** Wraps children in a scroll-triggered [data-reveal] entrance (see globals.css). */
export function Reveal({ children, className, delayMs = 0 }: RevealProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-reveal
      className={[className, isVisible ? "is-visible" : ""].filter(Boolean).join(" ")}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
