import { Reveal } from "@/components/ui/Reveal";

const FORMATS = [
  {
    ext: "docx",
    label: "Word",
    accent: "var(--word)",
    points: ["Page size: Letter or A4", "Title page: inline or its own page", "Real Word heading/list styles"],
  },
  {
    ext: "xlsx",
    label: "Excel",
    accent: "var(--excel)",
    points: ["Each table becomes its own sheet", "Overview sheet toggle", "Header row freeze + autofilter toggle"],
  },
  {
    ext: "pptx",
    label: "PowerPoint",
    accent: "var(--ppt)",
    points: ["Slide size: 16:9 or 4:3", "Title slide toggle", "Headings become real slide breaks"],
  },
] as const;

export function FormatShowcase() {
  return (
    <section className="border-b border-line px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Three real formats</h2>
          <div className="rule-draw mt-4 h-px w-24 bg-ink" style={{ animationDelay: "200ms" }} />
          <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-ink-soft">
            Each export is configurable rather than one-size-fits-all, using the same options
            available in the tool itself.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {FORMATS.map((format, i) => (
            <Reveal key={format.ext} delayMs={i * 100} className="h-full">
              <div className="card-lift group flex h-full flex-col border border-line bg-paper">
                {/* Its own element rather than a border-top, so the accent can
                    thicken on hover without nudging the card's box. */}
                <div
                  aria-hidden
                  className="accent-bar h-[3px] w-full shrink-0"
                  style={{ background: format.accent }}
                />
                <div className="p-5">
                  <p
                    className="font-mono text-[11px] uppercase tracking-wider transition-colors duration-200"
                    style={{ color: format.accent }}
                  >
                    .{format.ext}
                  </p>
                  <p className="mt-0.5 text-lg font-medium text-ink">{format.label}</p>
                  <ul className="mt-4 space-y-2">
                    {format.points.map((point) => (
                      <li
                        key={point}
                        className="flex gap-2 text-[13px] leading-snug text-ink-soft"
                      >
                        <span
                          aria-hidden
                          className="mt-[7px] h-px w-2 shrink-0 transition-all duration-200 group-hover:w-3.5"
                          style={{ background: format.accent }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
