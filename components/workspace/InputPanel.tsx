"use client";

import { useRef, useState } from "react";
import { MAX_TEXT_LENGTH } from "@/lib/limits";
import { Icon } from "@/components/ui/Icon";

type InputPanelProps = {
  value: string;
  onChange: (value: string) => void;
  smartFormatEnabled: boolean;
  onSmartFormat: () => void;
  isSmartFormatting: boolean;
  smartFormatError: string | null;
  onDismissSmartFormatError: () => void;
  canUndoSmartFormat: boolean;
  onUndoSmartFormat: () => void;
};

const TEXT_FILE_PATTERN = /\.(md|markdown|txt|text)$/i;

export function InputPanel({
  value,
  onChange,
  smartFormatEnabled,
  onSmartFormat,
  isSmartFormatting,
  smartFormatError,
  onDismissSmartFormatError,
  canUndoSmartFormat,
  onUndoSmartFormat,
}: InputPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);
  // Nested dragenter/dragleave on child nodes would otherwise flicker the
  // overlay, so track depth rather than a bare boolean.
  const dragDepth = useRef(0);

  const words = value.trim().length === 0 ? 0 : value.trim().split(/\s+/).length;
  const isOverLimit = value.length > MAX_TEXT_LENGTH;
  const capacity = Math.min(value.length / MAX_TEXT_LENGTH, 1);
  const isNearLimit = capacity > 0.8;

  function handleDragEnter(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setIsDragging(false);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    setDropError(null);

    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!TEXT_FILE_PATTERN.test(file.name)) {
      setDropError(`${file.name} is not a .md or .txt file.`);
      return;
    }
    if (file.size > MAX_TEXT_LENGTH * 4) {
      setDropError(`${file.name} is too large to load.`);
      return;
    }

    try {
      onChange(await file.text());
    } catch {
      setDropError(`Could not read ${file.name}.`);
    }
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          01 / Source Text
        </h2>
        <div className="flex items-center gap-3">
          <span
            className={[
              "font-mono text-[11px] tabular-nums transition-colors duration-200",
              isOverLimit ? "text-ppt" : isNearLimit ? "text-ink" : "text-ink-soft",
            ].join(" ")}
          >
            {words.toLocaleString()} words · {value.length.toLocaleString()}
            {isOverLimit ? ` / ${MAX_TEXT_LENGTH.toLocaleString()} chars (too long)` : " chars"}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={value.length === 0}
            className="underline-wipe font-mono text-[11px] uppercase tracking-wider text-ink-soft transition-colors duration-150 hover:text-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-ink-soft disabled:active:scale-100"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Capacity against MAX_TEXT_LENGTH. Stays invisible until there is
          something to report, so an empty editor shows no chrome. */}
      <div aria-hidden className="h-px w-full bg-transparent">
        <div
          className={[
            "h-px origin-left transition-[transform,background-color] duration-300 ease-out",
            isOverLimit ? "bg-ppt" : isNearLimit ? "bg-ink" : "bg-line",
          ].join(" ")}
          style={{ transform: `scaleX(${capacity})` }}
        />
      </div>

      {/* Hidden entirely where no Ollama instance is reachable (see
          lib/smartFormat.ts). Undo only ever appears after a Smart Format
          run, so it has nothing to strand. */}
      {smartFormatEnabled && (
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSmartFormat}
            disabled={value.trim().length === 0 || isOverLimit || isSmartFormatting}
            className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink transition-colors duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 disabled:active:scale-100"
          >
            <Icon
              name="sparkle"
              className={[
                "h-3.5 w-3.5 transition-transform duration-300",
                isSmartFormatting ? "animate-spin" : "group-hover:rotate-90",
              ].join(" ")}
            />
            <span className="underline-wipe">
              {isSmartFormatting ? "Formatting…" : "Smart Format"}
            </span>
          </button>
          {canUndoSmartFormat && !isSmartFormatting && (
            <button
              type="button"
              onClick={onUndoSmartFormat}
              data-reveal
              className="is-visible underline-wipe font-mono text-[11px] uppercase tracking-wider text-ink-soft transition-colors duration-150 hover:text-ink active:scale-[0.97]"
            >
              Undo
            </button>
          )}
        </div>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-ink-soft/70 sm:block">
          Local Ollama · restructures messy input
        </span>
      </div>
      )}

      {(smartFormatError || dropError) && (
        <div
          data-reveal
          className="is-visible flex items-start justify-between gap-3 border-b border-line bg-ppt/[0.07] px-4 py-2"
        >
          <p className="font-mono text-xs leading-relaxed text-ink">{smartFormatError ?? dropError}</p>
          <button
            type="button"
            onClick={() => (smartFormatError ? onDismissSmartFormatError() : setDropError(null))}
            aria-label="Dismiss message"
            className="mt-0.5 text-ink-soft transition-colors duration-150 hover:text-ink active:scale-90"
          >
            <Icon name="close" className="h-3 w-3" />
          </button>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          "Paste raw text or AI output here, from ChatGPT, Claude, Gemini, or anywhere else.\n\nMarkdown-style structure (# headings, - lists, | tables |) will carry over into the exported file.\n\nYou can also drop a .md or .txt file anywhere on this panel."
        }
        spellCheck={false}
        className="min-h-0 flex-1 resize-none bg-paper p-5 font-sans text-[15px] leading-relaxed text-ink transition-colors duration-200 placeholder:text-ink-soft/60 hover:bg-line/[0.06] focus:bg-paper"
      />

      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-paper/90">
          <div className="flex items-center gap-3 border-2 border-dashed border-ink px-6 py-4">
            <Icon name="file" className="h-5 w-5 text-ink" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink">
              Drop to load .md or .txt
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
