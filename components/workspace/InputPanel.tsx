import { MAX_TEXT_LENGTH } from "@/lib/limits";

type InputPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onSmartFormat: () => void;
  isSmartFormatting: boolean;
  smartFormatError: string | null;
  canUndoSmartFormat: boolean;
  onUndoSmartFormat: () => void;
};

export function InputPanel({
  value,
  onChange,
  onSmartFormat,
  isSmartFormatting,
  smartFormatError,
  canUndoSmartFormat,
  onUndoSmartFormat,
}: InputPanelProps) {
  const words = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;
  const isOverLimit = value.length > MAX_TEXT_LENGTH;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          01 / Source Text
        </h2>
        <div className="flex items-center gap-3">
          <span
            className={[
              "font-mono text-[11px] tabular-nums",
              isOverLimit ? "text-ppt" : "text-ink-soft",
            ].join(" ")}
          >
            {words.toLocaleString()} words · {value.length.toLocaleString()}
            {isOverLimit ? ` / ${MAX_TEXT_LENGTH.toLocaleString()} chars (too long)` : " chars"}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={value.length === 0}
            className="font-mono text-[11px] uppercase tracking-wider text-ink-soft underline decoration-line underline-offset-2 transition-colors duration-150 hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-ink-soft"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSmartFormat}
            disabled={value.trim().length === 0 || isOverLimit || isSmartFormatting}
            className="font-mono text-[11px] uppercase tracking-wider text-ink underline decoration-line underline-offset-2 transition-colors duration-150 hover:decoration-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:decoration-line"
          >
            {isSmartFormatting ? <span className="animate-pulse">Formatting…</span> : "✨ Smart Format"}
          </button>
          {canUndoSmartFormat && !isSmartFormatting && (
            <button
              type="button"
              onClick={onUndoSmartFormat}
              className="font-mono text-[11px] uppercase tracking-wider text-ink-soft underline decoration-line underline-offset-2 transition-colors duration-150 hover:text-ink"
            >
              Undo
            </button>
          )}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft/70">
          Local Ollama · restructures messy input
        </span>
      </div>

      {smartFormatError && (
        <p className="border-b border-line bg-line/10 px-4 py-2 font-mono text-xs text-ink">
          {smartFormatError}
        </p>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          "Paste raw text or AI output here, from ChatGPT, Claude, Gemini, or anywhere else.\n\nMarkdown-style structure (# headings, - lists, | tables |) will carry over into the exported file."
        }
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-paper p-5 font-sans text-[15px] leading-relaxed text-ink placeholder:text-ink-soft/60"
      />
    </div>
  );
}
