export const EXPORT_FORMATS = ["docx", "xlsx", "pptx"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];
