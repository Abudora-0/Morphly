// MorphlyDocument: the shared intermediate schema every parser produces
// and every format generator (docx, xlsx, pptx) consumes. Parsing logic
// is written once against this shape; adding a new export format only
// means writing a new renderer for it.

export type InlineMark = "bold" | "italic" | "code" | "strike";

export type InlineSpan = {
  text: string;
  marks: InlineMark[];
  href?: string;
};

export type ResolvedImage = {
  data: Buffer;
  format: "png" | "jpg" | "gif";
  width: number;
  height: number;
};

export type Block =
  | { type: "paragraph"; spans: InlineSpan[] }
  | { type: "heading"; level: 1 | 2 | 3 | 4; spans: InlineSpan[] }
  | { type: "list"; ordered: boolean; items: InlineSpan[][] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "quote"; spans: InlineSpan[] }
  | { type: "code"; text: string; language?: string }
  | { type: "divider" }
  // `resolved` is filled in by lib/images/resolveDocumentImages.ts between
  // parsing and generation — the parser only ever produces url/alt.
  // Left undefined when the image couldn't be fetched/validated; generators
  // render an "unavailable" fallback in that case.
  | { type: "image"; url: string; alt: string; resolved?: ResolvedImage };

export type MorphlyDocument = {
  title?: string;
  blocks: Block[];
};

export function plainText(spans: InlineSpan[]): string {
  return spans.map((s) => s.text).join("");
}
