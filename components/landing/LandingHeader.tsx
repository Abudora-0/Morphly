"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/ui/Wordmark";
import { Arrow } from "@/components/ui/Arrow";

export function LandingHeader() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
      setScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header
      className={[
        "header-sticky sticky top-0 z-50 border-b bg-paper/95 backdrop-blur-[2px]",
        scrolled ? "border-ink" : "border-line",
      ].join(" ")}
    >
      <div className="flex items-center justify-between px-5 py-3">
        <Link href="/" className="group leading-none" aria-label="Morphly home">
          <Wordmark interactive />
        </Link>
        <Link
          href="/workspace"
          className="group flex items-center gap-2 border border-line px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-ink transition duration-150 hover:border-ink hover:bg-ink hover:text-paper active:scale-[0.98]"
        >
          Launch
          <Arrow className="h-3 w-3" />
        </Link>
      </div>
      {/* Reading progress, drawn as a hairline rather than a filled bar. */}
      <div
        aria-hidden
        className="scroll-progress h-px origin-left bg-ink"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  );
}
