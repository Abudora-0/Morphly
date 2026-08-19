import { describe, expect, it } from "vitest";
import { resolveDocumentImages } from "./resolveDocumentImages";
import type { MorphlyDocument } from "@/lib/parser/schema";
import { PNG_1X1_BASE64 } from "@/lib/testFixtures";

const DATA_URI = `data:image/png;base64,${PNG_1X1_BASE64}`;

describe("resolveDocumentImages", () => {
  it("resolves data: URI image blocks in place", async () => {
    const doc: MorphlyDocument = {
      blocks: [{ type: "image", url: DATA_URI, alt: "x" }],
    };
    const resolved = await resolveDocumentImages(doc);
    const block = resolved.blocks[0];
    expect(block.type).toBe("image");
    if (block.type === "image") {
      expect(block.resolved).toBeDefined();
      expect(block.resolved?.width).toBe(1);
    }
  });

  it("leaves non-image blocks and documents without images untouched", async () => {
    const doc: MorphlyDocument = { title: "T", blocks: [{ type: "paragraph", spans: [] }] };
    const resolved = await resolveDocumentImages(doc);
    expect(resolved).toEqual(doc);
  });

  it("caps resolution at MAX_IMAGES_PER_DOCUMENT, leaving the rest unresolved", async () => {
    const doc: MorphlyDocument = {
      blocks: Array.from({ length: 25 }, () => ({ type: "image" as const, url: DATA_URI, alt: "" })),
    };
    const resolved = await resolveDocumentImages(doc);
    const resolvedCount = resolved.blocks.filter(
      (b) => b.type === "image" && b.resolved !== undefined,
    ).length;
    const unresolvedCount = resolved.blocks.filter(
      (b) => b.type === "image" && b.resolved === undefined,
    ).length;
    expect(resolvedCount).toBe(20);
    expect(unresolvedCount).toBe(5);
  });
});
