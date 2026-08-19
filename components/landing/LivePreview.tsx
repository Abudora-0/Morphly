"use client";

import { useReveal } from "@/lib/useReveal";

// Mirrors components/workspace/OutlinePreview.tsx's own visual language
// (mono labels, the same block glyphs) so this reads as a real preview of
// the tool's actual UI, not a staged mockup.
const OUTLINE_LINES = [
  { glyph: null, text: "Q3 Regional Summary", indent: 0, strong: true },
  { glyph: null, text: "H2 Highlights", indent: 0, strong: false },
  { glyph: "•", text: "bullet list · 2 items", indent: 1, strong: false },
  { glyph: null, text: "H2 Regional Table", indent: 0, strong: false },
  { glyph: "▦", text: "table · 3 rows", indent: 1, strong: false },
] as const;

export function LivePreview() {
  const { ref, isVisible } = useReveal<HTMLDivElement>();

  return (
    <section className="border-b border-line px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Structure, not just text
        </h2>
        <div className="rule-draw mt-4 h-px w-24 bg-ink" />
        <p className="mt-5 text-[14px] leading-relaxed text-ink-soft">
          As you paste, Morphly builds a live outline of what it found. The preview shown here is
          the actual structure panel from the tool.
        </p>

        <div ref={ref} className="mt-10 border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
              04 / Structure Preview
            </h3>
            <span
              className={[
                "font-mono text-[10px] uppercase tracking-wider transition-colors duration-500",
                isVisible ? "text-excel" : "text-ink-soft/50",
              ].join(" ")}
            >
              {isVisible ? "5 blocks" : "Waiting"}
            </span>
          </div>
          <div className="px-4 py-6">
            {!isVisible ? (
              <div aria-hidden className="skeleton-breathe space-y-2.5">
                <div className="h-2 w-2/3 bg-line" />
                <div className="ml-3 h-2 w-2/5 bg-line" />
                <div className="ml-3 h-2 w-1/2 bg-line" />
                <div className="h-2 w-5/6 bg-line" />
                <div className="ml-3 h-2 w-1/3 bg-line" />
              </div>
            ) : (
              <ul className="space-y-1">
                {OUTLINE_LINES.map((line, i) => (
                  <li
                    key={i}
                    data-reveal
                    className={[
                      "is-visible flex items-center gap-2 truncate font-mono text-xs",
                      line.indent ? "pl-3 text-ink-soft" : "text-ink",
                      line.strong && "font-medium uppercase tracking-wider",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    {line.glyph && <span aria-hidden>{line.glyph}</span>}
                    <span className="truncate">{line.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
