import type { MorphlyDocument } from "@/lib/parser/schema";
import type { ExportFormat, ExportOptions } from "@/lib/exportFormat";
import { FormatTab } from "@/components/ui/FormatTab";
import { Arrow } from "@/components/ui/Arrow";
import { Icon } from "@/components/ui/Icon";
import { OutlinePreview } from "@/components/workspace/OutlinePreview";
import { FormatOptions } from "@/components/workspace/FormatOptions";
import { PromptRecipe } from "@/components/workspace/PromptRecipe";

const FORMATS: { id: ExportFormat; label: string; extension: string; accent: string; disabled?: boolean }[] = [
  { id: "docx", label: "Word", extension: "docx", accent: "var(--word)" },
  { id: "xlsx", label: "Excel", extension: "xlsx", accent: "var(--excel)" },
  { id: "pptx", label: "PowerPoint", extension: "pptx", accent: "var(--ppt)" },
];

type ConfigPanelProps = {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  options: ExportOptions;
  onOptionsChange: <F extends ExportFormat>(format: F, partial: Partial<ExportOptions[F]>) => void;
  doc: MorphlyDocument;
  isEmpty: boolean;
  isConverting: boolean;
  didExport: boolean;
  error: string | null;
  onDismissError: () => void;
  onExport: () => void;
};

export function ConfigPanel({
  format,
  onFormatChange,
  options,
  onOptionsChange,
  doc,
  isEmpty,
  isConverting,
  didExport,
  error,
  onDismissError,
  onExport,
}: ConfigPanelProps) {
  const activeAccent = FORMATS.find((f) => f.id === format)?.accent ?? "var(--word)";

  return (
    <div className="flex min-h-0 w-full flex-col lg:w-[360px]">
      <div className="border-b border-line px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">02 / Output Format</h2>
      </div>

      <div className="flex border-b border-line">
        {FORMATS.map((f) => (
          <FormatTab
            key={f.id}
            label={f.label}
            extension={f.extension}
            accent={f.accent}
            active={format === f.id}
            disabled={f.disabled}
            onSelect={() => onFormatChange(f.id)}
          />
        ))}
      </div>

      {/* Sits with the format tabs, since the right prompt depends on which
          format is selected. */}
      <PromptRecipe format={format} />

      <div className="border-b border-line px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">03 / Configure</h2>
      </div>

      <div className="border-b border-line px-4 py-1">
        <FormatOptions format={format} options={options} onChange={onOptionsChange} />
      </div>

      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">04 / Structure Preview</h2>
        {!isEmpty && (
          <span className="font-mono text-[11px] tabular-nums text-ink-soft">
            {doc.blocks.length} {doc.blocks.length === 1 ? "block" : "blocks"}
          </span>
        )}
      </div>

      <OutlinePreview doc={doc} isEmpty={isEmpty} />

      <div className="border-t border-line p-4">
        {error && (
          <div
            data-reveal
            className="is-visible mb-3 flex items-start justify-between gap-3 border border-ppt/40 bg-ppt/[0.07] px-3 py-2"
          >
            <p className="font-mono text-xs leading-relaxed text-ink">{error}</p>
            <button
              type="button"
              onClick={onDismissError}
              aria-label="Dismiss error"
              className="mt-0.5 text-ink-soft transition-colors duration-150 hover:text-ink active:scale-90"
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onExport}
          disabled={isEmpty || isConverting}
          className="group flex w-full items-center justify-center gap-2.5 border py-3 text-sm font-medium uppercase tracking-wider text-paper transition duration-150 hover:brightness-95 active:scale-[0.99] active:brightness-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:brightness-100 disabled:active:scale-100"
          style={{ background: activeAccent, borderColor: activeAccent }}
        >
          {isConverting ? (
            <span className="animate-pulse">Converting…</span>
          ) : didExport ? (
            <>
              <Icon name="check" className="h-4 w-4" />
              Downloaded
            </>
          ) : (
            <>
              Export .{format}
              <Arrow direction="down" className="h-4 w-4" />
            </>
          )}
        </button>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-ink-soft/70">
          <kbd className="font-mono">Ctrl</kbd> + <kbd className="font-mono">Enter</kbd> to export
        </p>
      </div>
    </div>
  );
}
