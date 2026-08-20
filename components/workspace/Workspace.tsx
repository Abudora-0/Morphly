"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import type { ExportFormat, ExportOptions } from "@/lib/exportFormat";
import { MAX_TEXT_LENGTH } from "@/lib/limits";
import {
  DEFAULT_EXPORT_PREFERENCES,
  readExportPreferences,
  writeExportPreferences,
} from "@/lib/exportPreferences";
import { InputPanel } from "@/components/workspace/InputPanel";
import { ConfigPanel } from "@/components/workspace/ConfigPanel";

type WorkspaceProps = {
  /** Resolved on the server; see lib/smartFormat.ts. */
  smartFormatEnabled: boolean;
};

export function Workspace({ smartFormatEnabled }: WorkspaceProps) {
  const [text, setText] = useState("");
  // Starts at the defaults so the first client render matches the
  // prerendered HTML, then hydrates from localStorage on mount.
  const [format, setFormat] = useState<ExportFormat>(DEFAULT_EXPORT_PREFERENCES.format);
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_PREFERENCES.options);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [didExport, setDidExport] = useState(false);
  const exportResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isSmartFormatting, setIsSmartFormatting] = useState(false);
  const [smartFormatError, setSmartFormatError] = useState<string | null>(null);
  const [preSmartFormatText, setPreSmartFormatText] = useState<string | null>(null);

  const doc = useMemo(() => markdownToSchema(text), [text]);
  const isEmpty = text.trim().length === 0 || text.length > MAX_TEXT_LENGTH;

  useEffect(() => {
    // Deliberate exception to set-state-in-effect. localStorage cannot be read
    // during render without diverging from the prerendered HTML, and this is a
    // one-time load rather than an ongoing subscription, so useSyncExternalStore
    // would be the wrong shape. React batches these into a single extra render,
    // which is the whole cost.
    const stored = readExportPreferences();
    /* eslint-disable react-hooks/set-state-in-effect */
    setFormat(stored.format);
    setOptions(stored.options);
    setHasLoadedPreferences(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    // Guarded so the initial defaults never overwrite a stored record. Both
    // effects run on mount before the read's state update is applied, so
    // without this the mount pass writes defaults over what was just read.
    if (!hasLoadedPreferences) return;
    writeExportPreferences({ format, options });
  }, [hasLoadedPreferences, format, options]);

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

  const handleExport = useCallback(async () => {
    if (isEmpty || isConverting) return;
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

      // Briefly confirm on the button itself, so a download that the browser
      // handles silently still produces visible feedback.
      setDidExport(true);
      if (exportResetTimer.current) clearTimeout(exportResetTimer.current);
      exportResetTimer.current = setTimeout(() => setDidExport(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsConverting(false);
    }
  }, [isEmpty, isConverting, text, format, options]);

  useEffect(() => () => {
    if (exportResetTimer.current) clearTimeout(exportResetTimer.current);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void handleExport();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleExport]);

  return (
    <div className="flex min-h-0 flex-1 flex-col divide-y divide-line border border-line lg:flex-row lg:divide-x lg:divide-y-0">
      <InputPanel
        value={text}
        onChange={handleTextChange}
        smartFormatEnabled={smartFormatEnabled}
        onSmartFormat={handleSmartFormat}
        isSmartFormatting={isSmartFormatting}
        smartFormatError={smartFormatError}
        onDismissSmartFormatError={() => setSmartFormatError(null)}
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
        didExport={didExport}
        error={error}
        onDismissError={() => setError(null)}
        onExport={handleExport}
      />
    </div>
  );
}
