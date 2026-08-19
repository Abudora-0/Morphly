export const EXPORT_FORMATS = ["docx", "xlsx", "pptx"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export type DocxOptions = {
  pageSize: "letter" | "a4";
  titlePage: boolean;
};

export type XlsxOptions = {
  includeOverview: boolean;
  freezeHeader: boolean;
};

export type PptxOptions = {
  slideSize: "16:9" | "4:3";
  titleSlide: boolean;
};

export type ExportOptions = {
  docx: DocxOptions;
  xlsx: XlsxOptions;
  pptx: PptxOptions;
};

// Every default below preserves the generators' pre-existing behavior
// exactly, since these options are purely additive, not a behavior change.
export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  docx: { pageSize: "letter", titlePage: false },
  xlsx: { includeOverview: true, freezeHeader: true },
  pptx: { slideSize: "16:9", titleSlide: true },
};
