// Shared test-only fixtures. Not imported by any production code.

import type { ResolvedImage } from "@/lib/parser/schema";

// A real, minimal 1x1 transparent PNG.
export const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export function fakeResolvedPng(width = 400, height = 200): ResolvedImage {
  return { data: Buffer.from(PNG_1X1_BASE64, "base64"), format: "png", width, height };
}
