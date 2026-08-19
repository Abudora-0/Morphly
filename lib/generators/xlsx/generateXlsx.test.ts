import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { generateXlsx } from "./generateXlsx";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/exportFormat";
import type { MorphlyDocument } from "@/lib/parser/schema";
import { fakeResolvedPng } from "@/lib/testFixtures";

async function sheetNames(buffer: Buffer): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("xl/workbook.xml")!.async("string");
  return [...xml.matchAll(/<sheet[^>]*name="([^"]+)"/g)].map((m) => m[1]);
}

describe("generateXlsx", () => {
  it("gives each table its own sheet, named from the nearest preceding heading, plus an Overview", async () => {
    const doc = markdownToSchema(
      "# Report\n\n## Region A\n\n| X | Y |\n|---|---|\n| 1 | 2 |\n\n## Region B\n\n| X | Y |\n|---|---|\n| 3 | 4 |",
    );
    const names = await sheetNames(await generateXlsx(doc, DEFAULT_EXPORT_OPTIONS.xlsx));
    expect(names).toEqual(["Overview", "Region A", "Region B"]);
  });

  it("skips the Overview sheet for a lone table with no other content", async () => {
    const doc = markdownToSchema("| Name | Score |\n| --- | --- |\n| Alice | 92 |");
    const names = await sheetNames(await generateXlsx(doc, DEFAULT_EXPORT_OPTIONS.xlsx));
    expect(names).toEqual(["Table 1"]);
  });

  it("falls back to a single Overview sheet for prose with no tables", async () => {
    const doc = markdownToSchema("Just a plain paragraph, nothing tabular.");
    const names = await sheetNames(await generateXlsx(doc, DEFAULT_EXPORT_OPTIONS.xlsx));
    expect(names).toEqual(["Overview"]);
  });

  it("forces the Overview sheet off when includeOverview is false", async () => {
    const doc = markdownToSchema("# Report\n\n## A\n\n| X | Y |\n|---|---|\n| 1 | 2 |");
    const names = await sheetNames(
      await generateXlsx(doc, { ...DEFAULT_EXPORT_OPTIONS.xlsx, includeOverview: false }),
    );
    expect(names).toEqual(["A"]);
  });

  it("omits the frozen pane on table sheets when freezeHeader is false", async () => {
    const doc = markdownToSchema("| X | Y |\n|---|---|\n| 1 | 2 |");
    const zip = await JSZip.loadAsync(
      await generateXlsx(doc, { ...DEFAULT_EXPORT_OPTIONS.xlsx, freezeHeader: false }),
    );
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).not.toContain("frozen");
  });

  it("freezes the header row by default", async () => {
    const doc = markdownToSchema("| X | Y |\n|---|---|\n| 1 | 2 |");
    const zip = await JSZip.loadAsync(await generateXlsx(doc, DEFAULT_EXPORT_OPTIONS.xlsx));
    const xml = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(xml).toContain("frozen");
  });

  it("embeds a resolved image on the Overview sheet", async () => {
    const doc: MorphlyDocument = {
      title: "Report",
      blocks: [{ type: "image", url: "https://x.test/chart.png", alt: "chart", resolved: fakeResolvedPng() }],
    };
    const zip = await JSZip.loadAsync(await generateXlsx(doc, DEFAULT_EXPORT_OPTIONS.xlsx));
    expect(Object.keys(zip.files).some((f) => f.startsWith("xl/media/"))).toBe(true);
    const drawing = Object.keys(zip.files).find((f) => f.startsWith("xl/drawings/drawing"));
    expect(drawing).toBeDefined();
  });

  it("renders a fallback notice instead of a broken image when resolution failed", async () => {
    const doc: MorphlyDocument = {
      title: "Report",
      blocks: [{ type: "image", url: "https://x.test/broken.png", alt: "a chart" }],
    };
    const zip = await JSZip.loadAsync(await generateXlsx(doc, DEFAULT_EXPORT_OPTIONS.xlsx));
    const xml = await zip.file("xl/sharedStrings.xml")!.async("string");
    expect(xml).toContain("Image unavailable");
    expect(xml).toContain("a chart");
  });
});
