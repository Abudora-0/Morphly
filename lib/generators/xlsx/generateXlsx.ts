import ExcelJS from "exceljs";
import type { Block, MorphlyDocument } from "@/lib/parser/schema";
import { plainText } from "@/lib/parser/schema";

const HEADER_FILL: ExcelJS.Fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7E5DE" } };
const HEADER_BORDER: Partial<ExcelJS.Borders> = {
  bottom: { style: "thin", color: { argb: "FF141414" } },
};
const OVERVIEW_WIDTH = 110;
const MIN_COL_WIDTH = 10;
const MAX_COL_WIDTH = 42;

type TableSheet = {
  name: string;
  headers: string[];
  rows: string[][];
};

export async function generateXlsx(doc: MorphlyDocument): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Morphly";
  workbook.created = new Date();

  const { overviewBlocks, tables } = splitBlocks(doc);
  const usedNames = new Set<string>();

  const hasNonTableContent = overviewBlocks.some((entry) => entry.block.type !== "table");
  const shouldRenderOverview = Boolean(doc.title) || hasNonTableContent || tables.length > 1;

  if (shouldRenderOverview) {
    const overviewName = reserveName("Overview", usedNames);
    buildOverviewSheet(workbook.addWorksheet(overviewName), doc.title, overviewBlocks, tables);
  }

  for (const table of tables) {
    const sheetName = reserveName(table.name, usedNames);
    buildTableSheet(workbook.addWorksheet(sheetName), table.headers, table.rows);
  }

  if (workbook.worksheets.length === 0) {
    workbook.addWorksheet("Sheet1");
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

// --- Block partitioning -----------------------------------------------

type OverviewEntry = { block: Block; refSheet?: string };

function splitBlocks(doc: MorphlyDocument): { overviewBlocks: OverviewEntry[]; tables: TableSheet[] } {
  const overviewBlocks: OverviewEntry[] = [];
  const tables: TableSheet[] = [];
  let lastHeading = "";
  let tableCount = 0;

  for (const block of doc.blocks) {
    if (block.type === "heading") {
      lastHeading = plainText(block.spans);
      overviewBlocks.push({ block });
      continue;
    }

    if (block.type === "table") {
      tableCount += 1;
      const name = sanitizeSheetName(lastHeading || `Table ${tableCount}`);
      tables.push({ name, headers: block.headers, rows: block.rows });
      overviewBlocks.push({ block, refSheet: name });
      continue;
    }

    overviewBlocks.push({ block });
  }

  return { overviewBlocks, tables };
}

// --- Overview sheet -----------------------------------------------------

function buildOverviewSheet(
  sheet: ExcelJS.Worksheet,
  title: string | undefined,
  entries: OverviewEntry[],
  tables: TableSheet[],
) {
  sheet.columns = [{ width: OVERVIEW_WIDTH }];
  sheet.views = [{ state: "frozen", ySplit: title ? 2 : 0 }];

  if (title) {
    const row = sheet.addRow([title]);
    row.font = { bold: true, size: 16 };
    sheet.addRow([]);
  }

  for (const entry of entries) {
    addOverviewRow(sheet, entry);
  }

  if (tables.length > 0 && entries.some((e) => e.block.type !== "table")) {
    sheet.addRow([]);
  }
}

function addOverviewRow(sheet: ExcelJS.Worksheet, entry: OverviewEntry) {
  const { block } = entry;

  switch (block.type) {
    case "heading": {
      const row = sheet.addRow([plainText(block.spans)]);
      row.font = { bold: true, size: 14 - block.level };
      row.alignment = { indent: block.level - 1 };
      return;
    }

    case "paragraph": {
      const row = sheet.addRow([plainText(block.spans)]);
      row.alignment = { wrapText: true, vertical: "top" };
      return;
    }

    case "list": {
      block.items.forEach((item, i) => {
        const prefix = block.ordered ? `${i + 1}.` : "•";
        const row = sheet.addRow([`${prefix} ${plainText(item)}`]);
        row.alignment = { indent: 1, wrapText: true };
      });
      return;
    }

    case "quote": {
      const row = sheet.addRow([plainText(block.spans)]);
      row.font = { italic: true, color: { argb: "FF55534D" } };
      row.alignment = { indent: 1, wrapText: true };
      return;
    }

    case "code": {
      const row = sheet.addRow([block.text]);
      row.font = { name: "Consolas", size: 10 };
      row.alignment = { wrapText: true };
      return;
    }

    case "table": {
      const row = sheet.addRow([`→ See sheet: ${entry.refSheet}`]);
      row.font = { italic: true, color: { argb: "FF2B579A" } };
      return;
    }

    case "divider":
      sheet.addRow([]);
      return;
  }
}

// --- Table sheets ---------------------------------------------------------

function buildTableSheet(sheet: ExcelJS.Worksheet, headers: string[], rows: string[][]) {
  sheet.columns = headers.map((header, i) => ({ width: columnWidth(header, rows, i) }));

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = HEADER_FILL;
    cell.border = HEADER_BORDER;
  });

  for (const row of rows) {
    sheet.addRow(row);
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: Math.max(headers.length, 1) },
  };
}

function columnWidth(header: string, rows: string[][], columnIndex: number): number {
  const longest = rows.reduce((max, row) => Math.max(max, row[columnIndex]?.length ?? 0), header.length);
  return Math.min(Math.max(longest + 2, MIN_COL_WIDTH), MAX_COL_WIDTH);
}

// --- Sheet naming ---------------------------------------------------------

function sanitizeSheetName(raw: string): string {
  const cleaned = raw.replace(/[\\/*?[\]:]/g, "-").trim();
  return (cleaned || "Sheet").slice(0, 31);
}

function reserveName(base: string, used: Set<string>): string {
  let candidate = sanitizeSheetName(base);
  let suffix = 2;
  while (used.has(candidate.toLowerCase())) {
    const marker = ` (${suffix})`;
    candidate = sanitizeSheetName(base).slice(0, 31 - marker.length) + marker;
    suffix += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}
