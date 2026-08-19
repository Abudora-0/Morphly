import type { Block, MorphlyDocument } from "@/lib/parser/schema";
import { resolveImage } from "./resolveImage";
import { MAX_IMAGES_PER_DOCUMENT } from "@/lib/limits";

/**
 * Fetches and decodes every image block in a document, in parallel, up to
 * MAX_IMAGES_PER_DOCUMENT — beyond that cap, remaining images are left
 * unresolved (generators render an "unavailable" fallback for those), so a
 * paste with hundreds of image links can't fan out into hundreds of
 * concurrent fetches.
 */
export async function resolveDocumentImages(doc: MorphlyDocument): Promise<MorphlyDocument> {
  const imageBlocks = doc.blocks.filter((b): b is Extract<Block, { type: "image" }> => b.type === "image");
  if (imageBlocks.length === 0) return doc;

  const toResolve = imageBlocks.slice(0, MAX_IMAGES_PER_DOCUMENT);
  const resolved = await Promise.all(toResolve.map((block) => resolveImage(block.url)));
  const resolvedByBlock = new Map(toResolve.map((block, i) => [block, resolved[i]]));

  return {
    ...doc,
    blocks: doc.blocks.map((block) =>
      block.type === "image" && resolvedByBlock.has(block)
        ? { ...block, resolved: resolvedByBlock.get(block) ?? undefined }
        : block,
    ),
  };
}
