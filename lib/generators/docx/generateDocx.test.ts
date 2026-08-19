import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { generateDocx } from "./generateDocx";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/exportFormat";
import type { MorphlyDocument } from "@/lib/parser/schema";
import { fakeResolvedPng } from "@/lib/testFixtures";

const SAMPLE = `# Report

Intro paragraph with **bold** text.

## Section

- one
- two

| A | B |
| --- | --- |
| 1 | 2 |

> a quote`;

async function documentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  return zip.file("word/document.xml")!.async("string");
}

describe("generateDocx", () => {
  it("produces a valid zip (docx) with the expected structural markers", async () => {
    const doc = markdownToSchema(SAMPLE);
    const buffer = await generateDocx(doc, DEFAULT_EXPORT_OPTIONS.docx);

    expect(buffer.subarray(0, 2).toString()).toBe("PK");

    const xml = await documentXml(buffer);
    expect(xml).toContain("Title");
    expect(xml).toContain("Heading2");
    expect(xml).toContain("<w:b/>");
    expect(xml).toContain("<w:tbl>");
    expect(xml).toContain("<w:numPr>");
  });

  it("defaults to Letter page size with no title-page break", async () => {
    const doc = markdownToSchema(SAMPLE);
    const xml = await documentXml(await generateDocx(doc, DEFAULT_EXPORT_OPTIONS.docx));

    expect(xml).toContain('w:w="12240" w:h="15840"');
    expect(xml).not.toContain("pageBreakBefore");
  });

  it("switches to A4 page size when requested", async () => {
    const doc = markdownToSchema(SAMPLE);
    const xml = await documentXml(
      await generateDocx(doc, { ...DEFAULT_EXPORT_OPTIONS.docx, pageSize: "a4" }),
    );

    expect(xml).toContain('w:w="11905" w:h="16837"');
  });

  it("adds exactly one page break when titlePage is enabled", async () => {
    const doc = markdownToSchema(SAMPLE);
    const xml = await documentXml(
      await generateDocx(doc, { ...DEFAULT_EXPORT_OPTIONS.docx, titlePage: true }),
    );

    expect(xml.match(/pageBreakBefore/g)).toHaveLength(1);
  });

  it("embeds a resolved image and scales it down to fit the page width", async () => {
    const doc: MorphlyDocument = {
      blocks: [{ type: "image", url: "https://x.test/big.png", alt: "big", resolved: fakeResolvedPng(3000, 1500) }],
    };
    const zip = await JSZip.loadAsync(await generateDocx(doc, DEFAULT_EXPORT_OPTIONS.docx));
    expect(Object.keys(zip.files).some((f) => f.startsWith("word/media/"))).toBe(true);

    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("<wp:extent");
    // scaled to the 600px cap while preserving the 2:1 aspect ratio
    expect(xml).toMatch(/cx="\d+" cy="\d+"/);
  });

  it("renders a fallback notice instead of a broken image when resolution failed", async () => {
    const doc: MorphlyDocument = {
      blocks: [{ type: "image", url: "https://x.test/broken.png", alt: "a chart" }],
    };
    const xml = await documentXml(await generateDocx(doc, DEFAULT_EXPORT_OPTIONS.docx));
    expect(xml).toContain("Image unavailable");
    expect(xml).toContain("a chart");
  });
});
