"use client";

import { useId } from "react";

const M_PATH =
  "M10,18 L10,82 L28,82 L28,42 L50,66 L72,42 L72,82 L90,82 L90,18 L72,18 L50,40 L28,18 Z";

export function Wordmark() {
  const id = useId();
  const clipLeft = `${id}-l`;
  const clipMid = `${id}-m`;
  const clipRight = `${id}-r`;

  return (
    <span role="img" aria-label="Morphly" className="inline-flex items-center">
      <svg viewBox="0 0 100 100" className="h-7 w-7 shrink-0" aria-hidden>
        <defs>
          <clipPath id={clipLeft}>
            <rect x="0" y="0" width="34" height="100" />
          </clipPath>
          <clipPath id={clipMid}>
            <rect x="34" y="0" width="33" height="100" />
          </clipPath>
          <clipPath id={clipRight}>
            <rect x="67" y="0" width="33" height="100" />
          </clipPath>
        </defs>
        <path className="wordmark-band-1" d={M_PATH} fill="var(--word)" clipPath={`url(#${clipLeft})`} />
        <path className="wordmark-band-2" d={M_PATH} fill="var(--excel)" clipPath={`url(#${clipMid})`} />
        <path className="wordmark-band-3" d={M_PATH} fill="var(--ppt)" clipPath={`url(#${clipRight})`} />
      </svg>
      <span
        aria-hidden
        className="wordmark-word -ml-0.5 text-2xl font-medium tracking-tight text-ink"
        style={{ fontFamily: "var(--font-wordmark)" }}
      >
        orphly
      </span>
    </span>
  );
}
