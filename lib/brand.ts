// Single source of truth for the M-mark geometry and palette, shared between
// the DOM-rendered Wordmark component and the Satori-rendered social/icon
// images (app/opengraph-image.tsx, twitter-image.tsx, apple-icon.tsx), which
// can't reach the CSS custom properties in globals.css and need literal hex.

export const M_PATH =
  "M10,18 L10,82 L28,82 L28,42 L50,66 L72,42 L72,82 L90,82 L90,18 L72,18 L50,40 L28,18 Z";

export const BRAND_COLORS = {
  paper: "#FAF9F6",
  ink: "#141414",
  inkSoft: "#55534D",
  line: "#D8D5CC",
  word: "#2B579A",
  excel: "#217346",
  ppt: "#C8410C",
} as const;

// The M split into three vertical bands (left/mid/right), as fractions of
// the 0-100 viewBox used throughout (matches Wordmark.tsx's clipPath cuts).
export const M_BANDS = [
  { minX: 0, width: 34, color: BRAND_COLORS.word },
  { minX: 34, width: 33, color: BRAND_COLORS.excel },
  { minX: 67, width: 33, color: BRAND_COLORS.ppt },
] as const;
