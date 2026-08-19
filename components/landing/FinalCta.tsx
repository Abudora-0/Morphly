import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { Arrow } from "@/components/ui/Arrow";
// Read rather than restated, so the footer cannot drift from the real version.
import { version } from "@/package.json";

export function FinalCta() {
  return (
    <section className="px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Paste your text. See the file.
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/workspace"
              className="group flex items-center gap-2.5 border border-ink bg-ink px-6 py-3 text-sm font-medium uppercase tracking-wider text-paper transition duration-150 hover:brightness-110 active:scale-[0.99] active:brightness-95"
            >
              Launch Morphly
              <Arrow className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/Abudora-0/Morphly"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft transition-colors duration-150 hover:text-ink"
            >
              <span className="underline-wipe">View on GitHub</span>
              <Arrow direction="out" className="h-3 w-3" />
            </a>
          </div>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 max-w-6xl border-t border-line pt-6">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          Morphly · v{version} · MIT Licensed
        </p>
      </div>
    </section>
  );
}
