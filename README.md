# Morphly

Paste raw text or AI-generated output and export it as a fully formatted native Office file: `.docx`, `.xlsx`, or `.pptx`. No accounts, no uploads to a third party — everything runs through your own local Next.js server.

## How it works

One shared pipeline backs all three formats:

```
Pasted text
   │
   ▼
Parser (deterministic Markdown, or Smart Format via a local Ollama model)
   │
   ▼
MorphlyDocument (headings, paragraphs, lists, tables, quotes, code, dividers)
   │
   ├──► docx generator  (Word)
   ├──► xlsx generator  (Excel — tables become their own sheets)
   └──► pptx generator  (PowerPoint — headings become slide breaks)
```

The parsing and schema logic is written once in [`lib/parser/`](lib/parser); each format's renderer in [`lib/generators/`](lib/generators) consumes the same `MorphlyDocument` shape.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste some text, pick a format, and export.

## Smart Format (optional)

Smart Format uses a local [Ollama](https://ollama.com) model to restructure messy, non-Markdown input into clean Markdown before conversion. It's entirely optional — the deterministic parser works without it.

1. Install Ollama and pull a model: `ollama pull llama3.1`
2. Run `ollama serve`
3. Copy `.env.local.example` to `.env.local` and adjust `OLLAMA_HOST` / `OLLAMA_MODEL` if needed

This only works when Morphly itself is running locally — a deployed instance (e.g. on Vercel) has no network path to your machine's Ollama.

## Project structure

- `app/api/convert` — POST `{ text, format, options }` → streams back the generated file
- `app/api/smart-format` — POST `{ text }` → cleaned Markdown via Ollama
- `components/workspace/` — the split-screen UI (source text, format tabs, per-format config, live structure preview)
- `lib/parser/` — Markdown → `MorphlyDocument` schema
- `lib/generators/` — `MorphlyDocument` → `.docx` / `.xlsx` / `.pptx`
- `lib/llm/` — the Smart Format provider abstraction (Ollama today; swappable)

## Tech stack

Next.js (App Router) + TypeScript + Tailwind, [`docx`](https://www.npmjs.com/package/docx), [`exceljs`](https://www.npmjs.com/package/exceljs), and [`pptxgenjs`](https://www.npmjs.com/package/pptxgenjs) for file generation, [`remark`](https://github.com/remarkjs/remark) for Markdown parsing.
