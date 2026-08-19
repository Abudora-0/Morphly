import { MMark } from "@/components/ui/MMark";

type WordmarkProps = {
  /**
   * Adds the hover treatment where the outer bands fan apart. Only set this
   * where the lockup sits inside a `group` (a link or button), since the
   * effect is driven by the parent's hover state.
   */
  interactive?: boolean;
};

export function Wordmark({ interactive = false }: WordmarkProps) {
  const bands: [string, string, string] = interactive
    ? [
        "wordmark-band-1 wordmark-hover-band wordmark-hover-band-1",
        "wordmark-band-2 wordmark-hover-band",
        "wordmark-band-3 wordmark-hover-band wordmark-hover-band-3",
      ]
    : ["wordmark-band-1", "wordmark-band-2", "wordmark-band-3"];

  return (
    <span role="img" aria-label="Morphly" className="inline-flex items-center">
      <MMark className="h-7 w-7 shrink-0" bandClassNames={bands} />
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
