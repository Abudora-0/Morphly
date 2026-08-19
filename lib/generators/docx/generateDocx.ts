import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
  convertMillimetersToTwip,
} from "docx";
import type { Block, InlineSpan, MorphlyDocument } from "@/lib/parser/schema";
import type { DocxOptions } from "@/lib/exportFormat";
import { DEFAULT_EXPORT_OPTIONS } from "@/lib/exportFormat";

const BULLET_LIST = "morphly-bullet";
const ORDERED_LIST = "morphly-ordered";
const CODE_FONT = "Consolas";
const CODE_SHADING = "F3F3F3";
const QUOTE_BORDER_COLOR = "BFBFBF";

const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
  4: HeadingLevel.HEADING_4,
} as const;

const PAGE_SIZES = {
  letter: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
  a4: { width: convertMillimetersToTwip(210), height: convertMillimetersToTwip(297) },
};

export async function generateDocx(
  doc: MorphlyDocument,
  options: DocxOptions = DEFAULT_EXPORT_OPTIONS.docx,
): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  if (doc.title) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun(doc.title)],
      }),
    );
    if (options.titlePage) {
      children.push(new Paragraph({ pageBreakBefore: true, children: [] }));
    }
  }

  for (const block of doc.blocks) {
    children.push(...blockToDocx(block));
  }

  const document = new Document({
    title: doc.title,
    creator: "Morphly",
    numbering: {
      config: [
        {
          reference: BULLET_LIST,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
        {
          reference: ORDERED_LIST,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [{ properties: { page: { size: PAGE_SIZES[options.pageSize] } }, children }],
  });

  return Packer.toBuffer(document);
}

function blockToDocx(block: Block): (Paragraph | Table)[] {
  switch (block.type) {
    case "heading":
      return [
        new Paragraph({
          heading: HEADING_MAP[block.level],
          children: spansToRuns(block.spans),
        }),
      ];

    case "paragraph":
      return [new Paragraph({ children: spansToRuns(block.spans) })];

    case "quote":
      return [
        new Paragraph({
          indent: { left: 720 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 12, color: QUOTE_BORDER_COLOR },
          },
          children: spansToRuns(block.spans, { italics: true }),
        }),
      ];

    case "list":
      return block.items.map(
        (item) =>
          new Paragraph({
            numbering: { reference: block.ordered ? ORDERED_LIST : BULLET_LIST, level: 0 },
            children: spansToRuns(item),
          }),
      );

    case "code":
      return block.text.split("\n").map(
        (line) =>
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: CODE_SHADING },
            children: [new TextRun({ text: line || " ", font: CODE_FONT, size: 20 })],
          }),
      );

    case "table":
      return [buildTable(block.headers, block.rows)];

    case "divider":
      return [
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" } },
          children: [],
        }),
      ];

    default:
      return [];
  }
}

function buildTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (text) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: "EDEDED" },
          width: { size: 100 / Math.max(headers.length, 1), type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        }),
    ),
  });

  const bodyRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (text) =>
            new TableCell({
              width: { size: 100 / Math.max(headers.length, 1), type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun(text)] })],
            }),
        ),
      }),
  );

  return new Table({ rows: [headerRow, ...bodyRows], width: { size: 100, type: WidthType.PERCENTAGE } });
}

function spansToRuns(spans: InlineSpan[], extra?: { italics?: boolean }): TextRun[] {
  if (spans.length === 0) return [new TextRun("")];

  return spans.map((span) => {
    if (span.marks.includes("code")) {
      return new TextRun({
        text: span.text,
        font: CODE_FONT,
        shading: { type: ShadingType.CLEAR, fill: CODE_SHADING },
      });
    }

    return new TextRun({
      text: span.text,
      bold: span.marks.includes("bold"),
      italics: extra?.italics || span.marks.includes("italic"),
      strike: span.marks.includes("strike"),
      style: span.href ? "Hyperlink" : undefined,
    });
  });
}
