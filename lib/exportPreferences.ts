import {
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_FORMATS,
  type ExportFormat,
  type ExportOptions,
} from "@/lib/exportFormat";

// Versioned so a future shape change can be introduced without having to
// interpret whatever an older build happened to write.
export const EXPORT_PREFERENCES_KEY = "morphly.export-preferences.v1";

export type ExportPreferences = {
  format: ExportFormat;
  options: ExportOptions;
};

export const DEFAULT_EXPORT_PREFERENCES: ExportPreferences = {
  format: "docx",
  options: DEFAULT_EXPORT_OPTIONS,
};

/**
 * Reads the last-used format and per-format options from localStorage.
 *
 * Everything stored is treated as untrusted: it is hand-editable, and an
 * older build may have written a different shape. Each field is validated
 * individually and falls back to its default, so a partial or corrupt
 * record degrades field by field instead of being discarded wholesale or,
 * worse, handed to the generators as-is.
 */
export function readExportPreferences(storage: StorageLike | undefined = defaultStorage()): ExportPreferences {
  const raw = tryRead(storage);
  if (raw === null) return DEFAULT_EXPORT_PREFERENCES;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_EXPORT_PREFERENCES;
  }

  const record = asRecord(parsed);
  const options = asRecord(record.options);
  const docx = asRecord(options.docx);
  const xlsx = asRecord(options.xlsx);
  const pptx = asRecord(options.pptx);

  const defaults = DEFAULT_EXPORT_PREFERENCES;
  return {
    format: pickFrom(record.format, EXPORT_FORMATS, defaults.format),
    options: {
      docx: {
        pageSize: pickFrom(docx.pageSize, ["letter", "a4"] as const, defaults.options.docx.pageSize),
        titlePage: pickBoolean(docx.titlePage, defaults.options.docx.titlePage),
      },
      xlsx: {
        includeOverview: pickBoolean(xlsx.includeOverview, defaults.options.xlsx.includeOverview),
        freezeHeader: pickBoolean(xlsx.freezeHeader, defaults.options.xlsx.freezeHeader),
      },
      pptx: {
        slideSize: pickFrom(pptx.slideSize, ["16:9", "4:3"] as const, defaults.options.pptx.slideSize),
        titleSlide: pickBoolean(pptx.titleSlide, defaults.options.pptx.titleSlide),
      },
    },
  };
}

/** Best-effort persist. Storage can be full or blocked, which is not worth surfacing. */
export function writeExportPreferences(
  preferences: ExportPreferences,
  storage: StorageLike | undefined = defaultStorage(),
): void {
  try {
    storage?.setItem(EXPORT_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Quota exceeded, or storage disabled entirely. Preferences are a
    // convenience, so losing them must never interrupt an export.
  }
}

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function defaultStorage(): StorageLike | undefined {
  // Undefined during SSR, and accessing it can throw outright when the
  // browser blocks storage rather than merely emptying it.
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function tryRead(storage: StorageLike | undefined): string | null {
  try {
    return storage?.getItem(EXPORT_PREFERENCES_KEY) ?? null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickFrom<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}
