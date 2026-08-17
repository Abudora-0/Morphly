import { NextRequest, NextResponse } from "next/server";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import { generateDocx } from "@/lib/generators/docx/generateDocx";
import { generateXlsx } from "@/lib/generators/xlsx/generateXlsx";
import { generatePptx } from "@/lib/generators/pptx/generatePptx";
import type { MorphlyDocument } from "@/lib/parser/schema";

const CONTENT_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;

type SupportedFormat = keyof typeof CONTENT_TYPES;

const GENERATORS: Record<SupportedFormat, (doc: MorphlyDocument) => Promise<Buffer>> = {
  docx: generateDocx,
  xlsx: generateXlsx,
  pptx: generatePptx,
};

function isSupportedFormat(value: unknown): value is SupportedFormat {
  return typeof value === "string" && value in CONTENT_TYPES;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = body?.text;
  const format = body?.format;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing text to convert." }, { status: 400 });
  }

  if (!isSupportedFormat(format)) {
    return NextResponse.json(
      { error: `Unsupported format "${format}". Supported: ${Object.keys(CONTENT_TYPES).join(", ")}.` },
      { status: 400 },
    );
  }

  const doc = markdownToSchema(text);
  const buffer = await GENERATORS[format](doc);
  const filename = `${slugify(doc.title) || "morphly-export"}.${format}`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function slugify(title?: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}
