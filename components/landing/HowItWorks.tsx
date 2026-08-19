import { Reveal } from "@/components/ui/Reveal";

const STEPS = [
  {
    n: "01",
    title: "Paste",
    body: "Drop in raw text or AI output. Markdown structure (headings, lists, tables) carries straight through.",
  },
  {
    n: "02",
    title: "Parse",
    body: "One shared parser builds a structured document: headings, paragraphs, lists, tables, quotes, code, images.",
  },
  {
    n: "03",
    title: "Export",
    body: "The same structure renders into a real file, via three generators fed by one source of truth.",
  },
] as const;

const FORMAT_CHIPS = [
  { label: ".docx", color: "var(--word)" },
  { label: ".xlsx", color: "var(--excel)" },
  { label: ".pptx", color: "var(--ppt)" },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-line px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">How it works</h2>
          <div className="rule-draw mt-4 h-px w-24 bg-ink" style={{ animationDelay: "200ms" }} />
        </Reveal>

        <div className="mt-10 grid gap-px bg-line sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal
              key={step.n}
              delayMs={i * 100}
              className="group bg-paper p-6 transition-colors duration-200 hover:bg-line/15"
            >
              <p className="flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <span className="text-ink transition-colors duration-200 group-hover:text-ink">
                  {step.n}
                </span>
                <span aria-hidden className="h-px w-4 bg-line transition-all duration-200 group-hover:w-7 group-hover:bg-ink" />
                <span className="transition-colors duration-200 group-hover:text-ink">{step.title}</span>
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{step.body}</p>
              {step.n === "03" && (
                <div className="mt-4 flex gap-2">
                  {FORMAT_CHIPS.map((chip, ci) => (
                    <span
                      key={chip.label}
                      className="border px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-transform duration-200 group-hover:-translate-y-0.5"
                      style={{
                        borderColor: chip.color,
                        color: chip.color,
                        transitionDelay: `${ci * 50}ms`,
                      }}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
