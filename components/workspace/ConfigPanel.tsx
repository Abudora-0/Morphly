import type { MorphlyDocument } from "@/lib/parser/schema";
import type { ExportFormat } from "@/lib/exportFormat";
import { FormatTab } from "@/components/ui/FormatTab";
import { OutlinePreview } from "@/components/workspace/OutlinePreview";

const FORMATS: { id: ExportFormat; label: string; extension: string; accent: string; disabled?: boolean }[] = [
  { id: "docx", label: "Word", extension: "docx", accent: "var(--word)" },
  { id: "xlsx", label: "Excel", extension: "xlsx", accent: "var(--excel)" },
  { id: "pptx", label: "PowerPoint", extension: "pptx", accent: "var(--ppt)" },
];

type ConfigPanelProps = {
  format: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
  doc: MorphlyDocument;
  isEmpty: boolean;
  isConverting: boolean;
  error: string | null;
  onExport: () => void;
};

export function ConfigPanel({
  format,
  onFormatChange,
  doc,
  isEmpty,
  isConverting,
  error,
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

      <div className="border-b border-line px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">03 / Structure Preview</h2>
      </div>

      <OutlinePreview doc={doc} isEmpty={isEmpty} />

      <div className="border-t border-line p-4">
        {error && (
          <p className="mb-3 border border-line bg-line/10 px-3 py-2 font-mono text-xs text-ink">{error}</p>
        )}
        <button
          type="button"
          onClick={onExport}
          disabled={isEmpty || isConverting}
          className="w-full border py-3 text-sm font-medium uppercase tracking-wider text-paper transition duration-150 hover:brightness-95 active:scale-[0.99] active:brightness-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:brightness-100 disabled:active:scale-100"
          style={{ background: activeAccent, borderColor: activeAccent }}
        >
          {isConverting ? <span className="animate-pulse">Converting…</span> : `Export .${format}`}
        </button>
      </div>
    </div>
  );
}
