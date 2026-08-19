import Link from "next/link";
import { Workspace } from "@/components/workspace/Workspace";
import { Wordmark } from "@/components/ui/Wordmark";
import { Arrow } from "@/components/ui/Arrow";
import { isSmartFormatEnabled } from "@/lib/smartFormat";

export default function WorkspacePage() {
  // Resolved on the server so the flag never has to be a NEXT_PUBLIC_ var.
  const smartFormatEnabled = isSmartFormatEnabled();

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-baseline gap-3">
          <h1 className="leading-none">
            <Link href="/" className="group" aria-label="Morphly home">
              <Wordmark interactive />
            </Link>
          </h1>
          <p className="hidden items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft sm:flex">
            AI text
            <Arrow className="h-3 w-3" />
            native Office files
          </p>
        </div>
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          <span aria-hidden className="h-1.5 w-1.5 bg-excel" />
          No account required
        </p>
      </header>
      <main className="flex min-h-0 flex-1 flex-col p-4">
        <Workspace smartFormatEnabled={smartFormatEnabled} />
      </main>
    </div>
  );
}
