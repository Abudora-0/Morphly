import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { PROMPT_RECIPES } from "@/lib/promptRecipes";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import { generateXlsx } from "@/lib/generators/xlsx/generateXlsx";
import { generatePptx } from "@/lib/generators/pptx/generatePptx";
import { DEFAULT_EXPORT_OPTIONS, EXPORT_FORMATS } from "@/lib/exportFormat";

/**
 * The recipes tell users what the pipeline does with their Markdown. If the
 * pipeline changes and these are not updated, the site is giving out advice
 * that no longer holds, which is worse than giving none. Each test pins one
 * claim the recipe text makes.
 */
describe("prompt recipes", () => {
  it("covers every export format", () => {
    expect(Object.keys(PROMPT_RECIPES).sort()).toEqual([...EXPORT_FORMATS].sort());
  });

  it("keeps the prompts free of fences, which would otherwise be copied into the reply", () => {
    for (const recipe of Object.values(PROMPT_RECIPES)) {
      expect(recipe.prompt).not.toContain("```");
    }
  });

  describe("docx: 'begin with a single # Title line, with nothing above it'", () => {
    it("promotes a leading H1 to the document title", () => {
      const doc = markdownToSchema("# Quarterly Report\n\n## Overview\n\nText.");
      expect(doc.title).toBe("Quarterly Report");
      expect(doc.blocks.some((b) => b.type === "heading" && b.level === 1)).toBe(false);
    });

    it("does not promote it when something precedes it, which is why the recipe says so", () => {
      const doc = markdownToSchema("Intro line.\n\n# Quarterly Report");
      expect(doc.title).toBeUndefined();
    });
  });

  describe("xlsx: 'the ## heading above each table becomes the sheet name'", () => {
    it("names each sheet from the heading directly above its table", async () => {
      const md = "## Revenue\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n## Costs\n\n| A | B |\n|---|---|\n| 3 | 4 |";
      const buffer = await generateXlsx(markdownToSchema(md), DEFAULT_EXPORT_OPTIONS.xlsx);
      const zip = await JSZip.loadAsync(buffer);
      const xml = await zip.file("xl/workbook.xml")!.async("string");
      const names = [...xml.matchAll(/<sheet[^>]*name="([^"]+)"/g)].map((m) => m[1]);

      expect(names).toContain("Revenue");
      expect(names).toContain("Costs");
    });
  });

  describe("pptx: '## starts a new slide, ### stays on the same one'", () => {
    async function slideCount(md: string): Promise<number> {
      const buffer = await generatePptx(markdownToSchema(md), {
        ...DEFAULT_EXPORT_OPTIONS.pptx,
        titleSlide: false,
      });
      const zip = await JSZip.loadAsync(buffer);
      return Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).length;
    }

    it("starts a new slide per level-2 heading", async () => {
      expect(await slideCount("## One\n\n- a\n\n## Two\n\n- b\n\n## Three\n\n- c")).toBe(3);
    });

    it("keeps a level-3 heading on the current slide", async () => {
      expect(await slideCount("## One\n\n- a\n\n### Still one\n\n- b")).toBe(1);
    });
  });
});
