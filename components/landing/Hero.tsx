import Link from "next/link";
import { MMark } from "@/components/ui/MMark";
import { Arrow } from "@/components/ui/Arrow";

const EXAMPLE_INPUT = `# Q3 Regional Summary

Revenue grew 18% this quarter, led by APAC.

## Highlights
- North America: $1.2M (+14%)
- APAC: $450K (+31%)

| Region | Growth |
| --- | --- |
| Europe | +22% |`;

export function Hero() {
  return (
    <section className="border-b border-line px-5 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="enter-up mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            AI text
            <Arrow className="h-3 w-3" />
            native Office files
          </p>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            <span className="enter-up block" style={{ animationDelay: "80ms" }}>
              Paste text.
            </span>
            <span className="enter-up block" style={{ animationDelay: "160ms" }}>
              Export a real Office file.
            </span>
          </h1>
          <p
            className="enter-up mt-6 max-w-md text-[15px] leading-relaxed text-ink-soft"
            style={{ animationDelay: "240ms" }}
          >
            Morphly converts pasted text, whether Markdown or raw output from ChatGPT, Claude,
            Gemini, or anywhere else, into a genuine <span className="text-ink">.docx</span>,{" "}
            <span className="text-ink">.xlsx</span>, or <span className="text-ink">.pptx</span> file.
            Not HTML wrapped in a file extension, but real native formatting, tables, and slides.
          </p>
          <div
            className="enter-up mt-8 flex flex-wrap items-center gap-6"
            style={{ animationDelay: "320ms" }}
          >
            <Link
              href="/workspace"
              className="group flex items-center gap-2.5 border border-ink bg-ink px-6 py-3 text-sm font-medium uppercase tracking-wider text-paper transition duration-150 hover:brightness-110 active:scale-[0.99] active:brightness-95"
            >
              Launch Morphly
              <Arrow className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft transition-colors duration-150 hover:text-ink"
            >
              <span className="underline-wipe">See how it works</span>
              <Arrow direction="down" className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <MMark
            className="h-32 w-32 sm:h-40 sm:w-40"
            bandClassNames={["wordmark-band-1", "wordmark-band-2", "wordmark-band-3"]}
          />
          <div
            className="enter-up card-lift w-full max-w-sm border border-line bg-paper"
            style={{ animationDelay: "400ms" }}
          >
            <div className="border-b border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              Example input
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 font-mono text-[11px] leading-relaxed text-ink-soft">
              {EXAMPLE_INPUT}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
