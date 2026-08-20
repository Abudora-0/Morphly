import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_EXPORT_PREFERENCES,
  EXPORT_PREFERENCES_KEY,
  readExportPreferences,
  writeExportPreferences,
} from "@/lib/exportPreferences";

function storageWith(value: string | null) {
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn(),
  };
}

function stored(value: unknown) {
  return storageWith(JSON.stringify(value));
}

const FULL = {
  format: "pptx",
  options: {
    docx: { pageSize: "a4", titlePage: true },
    xlsx: { includeOverview: false, freezeHeader: false },
    pptx: { slideSize: "4:3", titleSlide: false },
  },
};

describe("readExportPreferences", () => {
  it("returns defaults when nothing has been stored", () => {
    expect(readExportPreferences(storageWith(null))).toEqual(DEFAULT_EXPORT_PREFERENCES);
  });

  it("round-trips a complete record", () => {
    expect(readExportPreferences(stored(FULL))).toEqual(FULL);
  });

  describe("untrusted input", () => {
    it.each([
      ["malformed JSON", storageWith("{not json")],
      ["a JSON primitive", storageWith('"just a string"')],
      ["null", storageWith("null")],
      ["an array", storageWith("[1,2,3]")],
    ])("falls back to defaults for %s", (_label, storage) => {
      expect(readExportPreferences(storage)).toEqual(DEFAULT_EXPORT_PREFERENCES);
    });

    it("rejects a format that is not one of the real ones", () => {
      const result = readExportPreferences(stored({ format: "pdf" }));
      expect(result.format).toBe(DEFAULT_EXPORT_PREFERENCES.format);
    });

    it("rejects an out-of-range enum value", () => {
      const result = readExportPreferences(stored({ options: { docx: { pageSize: "a3" } } }));
      expect(result.options.docx.pageSize).toBe(DEFAULT_EXPORT_PREFERENCES.options.docx.pageSize);
    });

    it("rejects a non-boolean where a boolean belongs, rather than coercing it", () => {
      // "false" and 0 are both truthy/falsy traps a plain cast would let through.
      const result = readExportPreferences(
        stored({ options: { docx: { titlePage: "false" }, xlsx: { freezeHeader: 0 } } }),
      );
      expect(result.options.docx.titlePage).toBe(DEFAULT_EXPORT_PREFERENCES.options.docx.titlePage);
      expect(result.options.xlsx.freezeHeader).toBe(DEFAULT_EXPORT_PREFERENCES.options.xlsx.freezeHeader);
    });

    it("keeps the valid fields of a partly invalid record", () => {
      const result = readExportPreferences(
        stored({ format: "xlsx", options: { docx: { pageSize: "a4", titlePage: "nope" } } }),
      );

      expect(result.format).toBe("xlsx");
      expect(result.options.docx.pageSize).toBe("a4");
      expect(result.options.docx.titlePage).toBe(DEFAULT_EXPORT_PREFERENCES.options.docx.titlePage);
      expect(result.options.pptx).toEqual(DEFAULT_EXPORT_PREFERENCES.options.pptx);
    });

    it("always returns a fully populated shape, whatever was stored", () => {
      const result = readExportPreferences(stored({ options: { xlsx: {} } }));

      expect(Object.keys(result.options).sort()).toEqual(["docx", "pptx", "xlsx"]);
      expect(result.options.xlsx).toEqual(DEFAULT_EXPORT_PREFERENCES.options.xlsx);
    });
  });

  describe("unavailable storage", () => {
    it("falls back to defaults when there is no storage at all (SSR)", () => {
      expect(readExportPreferences(undefined)).toEqual(DEFAULT_EXPORT_PREFERENCES);
    });

    it("falls back to defaults when reading throws", () => {
      const storage = {
        getItem: vi.fn(() => {
          throw new Error("blocked");
        }),
        setItem: vi.fn(),
      };
      expect(readExportPreferences(storage)).toEqual(DEFAULT_EXPORT_PREFERENCES);
    });
  });
});

describe("writeExportPreferences", () => {
  it("persists under the versioned key", () => {
    const storage = storageWith(null);
    writeExportPreferences(DEFAULT_EXPORT_PREFERENCES, storage);

    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(
      EXPORT_PREFERENCES_KEY,
      JSON.stringify(DEFAULT_EXPORT_PREFERENCES),
    );
  });

  it("swallows a quota failure, since preferences must never break an export", () => {
    const storage = {
      getItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error("QuotaExceededError");
      }),
    };

    expect(() => writeExportPreferences(DEFAULT_EXPORT_PREFERENCES, storage)).not.toThrow();
  });

  it("does nothing when there is no storage", () => {
    expect(() => writeExportPreferences(DEFAULT_EXPORT_PREFERENCES, undefined)).not.toThrow();
  });
});
