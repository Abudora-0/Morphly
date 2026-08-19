import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { generatePptx } from "./generatePptx";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/exportFormat";
import type { MorphlyDocument } from "@/lib/parser/schema";
import { fakeResolvedPng } from "@/lib/testFixtures";

async function slideCount(buffer: Buffer): Promise<number> {
  const zip = await JSZip.loadAsync(buffer);
  return Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).length;
}

async function slideTexts(buffer: Buffer, index: number): Promise<string[]> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file(`ppt/slides/slide${index}.xml`)!.async("string");
  return [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);
}

async function sldSz(buffer: Buffer): Promise<{ cx: string; cy: string }> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("ppt/presentation.xml")!.async("string");
  const match = xml.match(/<p:sldSz cx="(\d+)" cy="(\d+)"/)!;
  return { cx: match[1], cy: match[2] };
}

async function pictureExtentEmu(buffer: Buffer, slideIndex: number): Promise<{ cx: number; cy: number }> {
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file(`ppt/slides/slide${slideIndex}.xml`)!.async("string");
  const picBlock = xml.match(/<p:pic>[\s\S]*?<\/p:pic>/)![0];
  const match = picBlock.match(/<a:ext cx="(\d+)" cy="(\d+)"\s*\/>/)!;
  return { cx: Number(match[1]), cy: Number(match[2]) };
}

describe("generatePptx", () => {
  it("gives the title its own slide, then one slide per top-level heading", async () => {
    const doc = markdownToSchema("# Deck\n\n## Slide One\n\n- point");
    const buffer = await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx);
    expect(await slideCount(buffer)).toBe(2);
    expect(await slideTexts(buffer, 1)).toEqual(["Deck"]);
  });

  it("skips the title slide when titleSlide is false", async () => {
    const doc = markdownToSchema("# Deck\n\n## Slide One\n\n- point");
    const buffer = await generatePptx(doc, { ...DEFAULT_EXPORT_OPTIONS.pptx, titleSlide: false });
    expect(await slideCount(buffer)).toBe(1);
    expect(await slideTexts(buffer, 1)).toEqual(["Slide One", "point"]);
  });

  // Regression test: a heading immediately followed only by a table used to
  // leave behind an empty title-only slide before the table's own slide,
  // because the content slide was created eagerly instead of lazily.
  it("does not leave an empty slide behind when a heading is immediately followed by a table", async () => {
    const doc = markdownToSchema("## Timeline\n\n| A | B |\n|---|---|\n| 1 | 2 |");
    const buffer = await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx);
    expect(await slideCount(buffer)).toBe(1);
    expect(await slideTexts(buffer, 1)).toContain("Timeline");
  });

  // Regression test: a long list used to render as one oversized text box
  // instead of splitting across "(cont.)" slides.
  it("splits a long list across continuation slides instead of overflowing one", async () => {
    const items = Array.from({ length: 25 }, (_, i) => `- Item ${i + 1} with some padding text`).join("\n");
    const doc = markdownToSchema(`## Backlog\n\n${items}`);
    const buffer = await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx);

    expect(await slideCount(buffer)).toBeGreaterThan(1);
    const slide2 = await slideTexts(buffer, 2);
    expect(slide2[0]).toBe("Backlog (cont.)");
  });

  it("uses the 16:9 layout by default and 4:3 when requested", async () => {
    const doc = markdownToSchema("# Deck");
    const sixteenNine = await sldSz(await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx));
    expect(sixteenNine).toEqual({ cx: "9144000", cy: "5143500" });

    const fourThree = await sldSz(
      await generatePptx(doc, { ...DEFAULT_EXPORT_OPTIONS.pptx, slideSize: "4:3" }),
    );
    expect(fourThree).toEqual({ cx: "9144000", cy: "6858000" });
  });

  it("honors a manual --- divider as a slide break", async () => {
    const doc = markdownToSchema("## Section\n\nFirst.\n\n---\n\nSecond, after the break.");
    const buffer = await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx);
    expect(await slideCount(buffer)).toBe(2);
    expect((await slideTexts(buffer, 2))[1]).toBe("Second, after the break.");
  });

  it("gives a resolved image its own dedicated slide", async () => {
    const doc: MorphlyDocument = {
      blocks: [
        { type: "heading", level: 2, spans: [{ text: "Chart", marks: [] }] },
        { type: "image", url: "https://x.test/chart.png", alt: "chart", resolved: fakeResolvedPng() },
      ],
    };
    const buffer = await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx);
    expect(await slideCount(buffer)).toBe(1);

    const zip = await JSZip.loadAsync(buffer);
    const slideXml = await zip.file("ppt/slides/slide1.xml")!.async("string");
    expect(slideXml).toContain("<p:pic>");
  });

  // Regression test: image-size reports pixels, but pptxgenjs positions
  // shapes in inches. A small source image used to get stretched to fill
  // the whole content box (and come out blurry) because the pixel value
  // was fed straight into the inches field without conversion.
  it("sizes a small image at its native dimensions (96dpi) instead of stretching it to fill the slide", async () => {
    const doc: MorphlyDocument = {
      blocks: [{ type: "image", url: "https://x.test/icon.png", alt: "icon", resolved: fakeResolvedPng(400, 200) }],
    };
    const buffer = await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx);
    const extent = await pictureExtentEmu(buffer, 1);

    // 400px / 96dpi * 914400 EMU/in = 3,810,000 EMU (and half that for 200px)
    expect(extent).toEqual({ cx: 3810000, cy: 1905000 });
  });

  it("renders a fallback notice on the slide when image resolution failed", async () => {
    const doc: MorphlyDocument = {
      blocks: [{ type: "image", url: "https://x.test/broken.png", alt: "a chart" }],
    };
    const buffer = await generatePptx(doc, DEFAULT_EXPORT_OPTIONS.pptx);
    const texts = (await slideTexts(buffer, 1)).join(" ");
    expect(texts).toContain("Image unavailable");
    expect(texts).toContain("a chart");
  });
});
