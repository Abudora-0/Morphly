"use client";

import { useId } from "react";
import { M_PATH, M_BANDS } from "@/lib/brand";

type MMarkProps = {
  className?: string;
  /** Per-band class names (left/mid/right), e.g. for entrance animations. */
  bandClassNames?: [string, string, string];
};

/** The bare tri-color M mark, with no "orphly" text. See Wordmark for the full lockup. */
export function MMark({ className, bandClassNames }: MMarkProps) {
  const id = useId();

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <defs>
        {M_BANDS.map((band) => (
          <clipPath id={`${id}-${band.minX}`} key={band.minX}>
            <rect x={band.minX} y="0" width={band.width} height="100" />
          </clipPath>
        ))}
      </defs>
      {M_BANDS.map((band, i) => (
        <path
          key={band.minX}
          className={bandClassNames?.[i]}
          d={M_PATH}
          fill={band.color}
          clipPath={`url(#${id}-${band.minX})`}
        />
      ))}
    </svg>
  );
}
