"use client";

import { useMemo, useState } from "react";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import type { ExportFormat, ExportOptions } from "@/lib/exportFormat";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/exportFormat";
import { InputPanel } from "@/components/workspace/InputPanel";
import { ConfigPanel } from "@/components/workspace/ConfigPanel";

export function Workspace() {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<ExportFormat>("docx");
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isSmartFormatting, setIsSmartFormatting] = useState(false);
  const [smartFormatError, setSmartFormatError] = useState<string | null>(null);
  const [preSmartFormatText, setPreSmartFormatText] = useState<string | null>(null);

  const doc = useMemo(() => markdownToSchema(text), [text]);
  const isEmpty = text.trim().length === 0;

  function handleTextChange(next: string) {
    setText(next);
    setPreSmartFormatText(null);
  }

  async function handleSmartFormat() {
    setSmartFormatError(null);
    setIsSmartFormatting(true);
    try {
      const res = await fetch("/api/smart-format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? `Smart Format failed (${res.status}).`);
      }

      setPreSmartFormatText(text);
      setText(body.markdown);
    } catch (err) {
      setSmartFormatError(err instanceof Error ? err.message : "Smart Format failed unexpectedly.");
    } finally {
      setIsSmartFormatting(false);
    }
  }

  function handleUndoSmartFormat() {
    if (preSmartFormatText === null) return;
    setText(preSmartFormatText);
    setPreSmartFormatText(null);
  }

  function handleOptionsChange<F extends ExportFormat>(target: F, partial: Partial<ExportOptions[F]>) {
    setOptions((prev) => ({ ...prev, [target]: { ...prev[target], ...partial } }));
  }

  async function handleExport() {
    setError(null);
    setIsConverting(true);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, format, options: options[format] }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Conversion failed (${res.status}).`);
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `morphly-export.${format}`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsConverting(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col divide-y divide-line border border-line lg:flex-row lg:divide-x lg:divide-y-0">
      <InputPanel
        value={text}
        onChange={handleTextChange}
        onSmartFormat={handleSmartFormat}
        isSmartFormatting={isSmartFormatting}
        smartFormatError={smartFormatError}
        canUndoSmartFormat={preSmartFormatText !== null}
        onUndoSmartFormat={handleUndoSmartFormat}
      />
      <ConfigPanel
        format={format}
        onFormatChange={setFormat}
        options={options}
        onOptionsChange={handleOptionsChange}
        doc={doc}
        isEmpty={isEmpty}
        isConverting={isConverting}
        error={error}
        onExport={handleExport}
      />
    </div>
  );
}
