import type { ExportFormat } from "@/lib/exportFormat";

/**
 * Prompts to hand an AI so its output maps cleanly onto each generator.
 *
 * Every line here reflects real parser/generator behaviour rather than
 * general prompting advice:
 * - The first `#` becomes the document title only when nothing precedes it
 *   (lib/parser/markdownToSchema.ts).
 * - An xlsx sheet is named after the heading directly above its table
 *   (lib/generators/xlsx/generateXlsx.ts).
 * - A pptx slide break happens on heading level 1 or 2; levels 3 and 4 stay
 *   inline on the current slide (lib/generators/pptx/generatePptx.ts).
 * - A fence wrapping the whole reply parses as one code block, so asking for
 *   bare Markdown matters.
 */
export type PromptRecipe = {
  /** What the reader gets out of following it. */
  summary: string;
  prompt: string;
};

// Each prompt ends on a worked example rather than a placeholder, so it can be
// pasted into an AI and run as-is to see what a good result looks like. The
// examples are chosen to exercise the format they belong to: per-region tables
// for the spreadsheet, one section per slide for the deck.

export const PROMPT_RECIPES: Record<ExportFormat, PromptRecipe> = {
  docx: {
    summary: "Headings become real Word styles, so ask for a clear section hierarchy.",
    prompt: `Write this as a structured document in Markdown.

- Begin with a single "# Title" line, with nothing above it.
- Use "## " for each main section and "### " for sub-sections.
- Use "- " for bullets and "1. " for numbered steps.
- Put any tabular data in a Markdown table with a header row.
- Reply with the Markdown only: no commentary, and do not wrap it in a code fence.

Topic: An onboarding guide for engineers joining a small software team. Cover first-day setup, how code review works, the release process, and who to ask for help. Include a table of the internal tools and what each is for.`,
  },
  xlsx: {
    summary: "Every table becomes its own sheet, named after the heading above it.",
    prompt: `Write this as Markdown made up mainly of data tables.

- Put each distinct dataset in its own Markdown table with a header row.
- Put a short "## Sheet Name" heading directly above each table. That heading becomes the sheet name.
- Keep one value per cell. No merged cells, and no blank header cells.
- Put any explanatory text before the first table.
- Reply with the Markdown only: no commentary, and do not wrap it in a code fence.

Topic: A 2025 sales summary. Give one table per region for North America, Europe, and Asia Pacific, each listing product, units sold, unit price, and total revenue. Add a short paragraph before the tables summarising the year.`,
  },
  pptx: {
    summary: "Each top-level heading starts a new slide, so keep sections short.",
    prompt: `Write this as a slide deck in Markdown.

- Begin with a single "# Deck Title" line.
- Use "## " once per slide. Each one starts a new slide.
- Give each slide 3 to 5 short bullets using "- ", not paragraphs.
- Use "### " for a sub-heading that should stay on the same slide.
- Reply with the Markdown only: no commentary, and do not wrap it in a code fence.

Topic: A kickoff deck for a company website redesign, with one slide each for goals, scope, timeline, the team, risks, and next steps.`,
  },
};
