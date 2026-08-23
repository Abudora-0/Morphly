"use client";

import { useEffect, useRef, useState } from "react";
import type { ExportFormat } from "@/lib/exportFormat";
import { PROMPT_RECIPES } from "@/lib/promptRecipes";
import { Icon } from "@/components/ui/Icon";

type PromptRecipeProps = {
  format: ExportFormat;
};

export function PromptRecipe({ format }: PromptRecipeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptRef = useRef<HTMLPreElement>(null);

  const recipe = PROMPT_RECIPES[format];

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(recipe.prompt);
      setCopied(true);
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
      copyResetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // The Clipboard API needs a focused document and a secure context, and
      // permissions can refuse it outright. Rather than have the button do
      // nothing visible, select the prompt so the user can copy it by hand.
      selectPrompt();
    }
  }

  function selectPrompt() {
    const node = promptRef.current;
    const selection = window.getSelection();
    if (!node || !selection) return;

    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-line/15"
      >
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft transition-colors duration-150 group-hover:text-ink">
          Prompt recipe
        </span>
        <span
          aria-hidden
          className={[
            "font-mono text-[11px] text-ink-soft transition-transform duration-200",
            isOpen ? "rotate-45" : "",
          ].join(" ")}
        >
          +
        </span>
      </button>

      {isOpen && (
        <div data-reveal className="is-visible px-4 pb-4">
          <p className="mb-3 text-[13px] leading-snug text-ink-soft">{recipe.summary}</p>

          <pre
            ref={promptRef}
            className="max-h-48 overflow-auto border border-line bg-line/[0.12] p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ink"
          >
            {recipe.prompt}
          </pre>

          <button
            type="button"
            onClick={handleCopy}
            className="group mt-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink transition-colors duration-150 active:scale-[0.97]"
          >
            <Icon name={copied ? "check" : "file"} className="h-3.5 w-3.5" />
            <span className="underline-wipe">{copied ? "Copied" : "Copy prompt"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
