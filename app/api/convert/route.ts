import { NextRequest, NextResponse } from "next/server";
import { markdownToSchema } from "@/lib/parser/markdownToSchema";
import { generateDocx } from "@/lib/generators/docx/generateDocx";
import { generateXlsx } from "@/lib/generators/xlsx/generateXlsx";
import { generatePptx } from "@/lib/generators/pptx/generatePptx";
import type { DocxOptions, PptxOptions, XlsxOptions } from "@/lib/exportFormat";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { CONVERT_RATE_LIMIT, MAX_TEXT_LENGTH } from "@/lib/limits";
import { resolveDocumentImages } from "@/lib/images/resolveDocumentImages";

const CONTENT_TYPES = {
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
} as const;

type SupportedFormat = keyof typeof CONTENT_TYPES;

function isSupportedFormat(value: unknown): value is SupportedFormat {
  return typeof value === "string" && value in CONTENT_TYPES;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseDocxOptions(raw: unknown): DocxOptions {
  const o = isRecord(raw) ? raw : {};
  return {
    pageSize: o.pageSize === "a4" ? "a4" : "letter",
    titlePage: o.titlePage === true,
  };
}

function parseXlsxOptions(raw: unknown): XlsxOptions {
  const o = isRecord(raw) ? raw : {};
  return {
    includeOverview: o.includeOverview !== false,
    freezeHeader: o.freezeHeader !== false,
  };
}

function parsePptxOptions(raw: unknown): PptxOptions {
  const o = isRecord(raw) ? raw : {};
  return {
    slideSize: o.slideSize === "4:3" ? "4:3" : "16:9",
    titleSlide: o.titleSlide !== false,
  };
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    `convert:${getClientIp(request)}`,
    CONVERT_RATE_LIMIT.limit,
    CONVERT_RATE_LIMIT.windowMs,
  );
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many conversions. Please wait a bit before trying again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const text = body?.text;
  const format = body?.format;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing text to convert." }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text is too long (max ${MAX_TEXT_LENGTH.toLocaleString()} characters).` },
      { status: 413 },
    );
  }

  if (!isSupportedFormat(format)) {
    return NextResponse.json(
      { error: `Unsupported format "${format}". Supported: ${Object.keys(CONTENT_TYPES).join(", ")}.` },
      { status: 400 },
    );
  }

  const parsed = markdownToSchema(text);
  const doc = await resolveDocumentImages(parsed);

  let buffer: Buffer;
  switch (format) {
    case "docx":
      buffer = await generateDocx(doc, parseDocxOptions(body?.options));
      break;
    case "xlsx":
      buffer = await generateXlsx(doc, parseXlsxOptions(body?.options));
      break;
    case "pptx":
      buffer = await generatePptx(doc, parsePptxOptions(body?.options));
      break;
  }

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
