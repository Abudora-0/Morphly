import { Reveal } from "@/components/ui/Reveal";

const SPECS = [
  { label: "Accounts", value: "None. No sign-up, no login, no database." },
  { label: "Text limit", value: "100,000 characters per conversion" },
  { label: "Rate limit", value: "20 conversions / 5 min, 10 Smart Format calls / 5 min" },
  { label: "Image fetch", value: "5 MB max per image, 20 images per document, 8s timeout" },
  {
    label: "Image safety",
    value: "Protocol allowlist, private-IP and metadata-endpoint blocking on every redirect hop",
  },
] as const;

export function SecuritySpec() {
  return (
    <section className="border-b border-line px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Nothing kept, nothing hidden
          </h2>
          <div className="rule-draw mt-4 h-px w-24 bg-ink" style={{ animationDelay: "200ms" }} />
          <p className="mt-5 text-[14px] leading-relaxed text-ink-soft">
            Your text is converted and the response sent back. That&apos;s the whole lifecycle.
          </p>
        </Reveal>

        <Reveal delayMs={100} className="mt-10 border border-line bg-paper">
          <div className="border-b border-line px-4 py-2.5">
            <h3 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">Properties</h3>
          </div>
          <dl>
            {SPECS.map((spec, i) => (
              <div
                key={spec.label}
                className={`spec-row flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-6 ${
                  i > 0 ? "border-t border-line" : ""
                }`}
              >
                <dt className="w-40 shrink-0 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  {spec.label}
                </dt>
                <dd className="text-[13px] leading-snug text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
