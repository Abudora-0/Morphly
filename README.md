<div align="center">

<img src=".github/banner.svg" alt="Morphly" width="100%" />

<br />

[![License: MIT](https://img.shields.io/badge/license-MIT-141414?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-141414?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-2B579A?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-141414?style=flat-square&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/deployed-vercel-141414?style=flat-square&logo=vercel&logoColor=white)](https://morphly-beta.vercel.app)

[![.DOCX](https://img.shields.io/badge/.DOCX-2B579A?style=flat-square)](#)
[![.XLSX](https://img.shields.io/badge/.XLSX-217346?style=flat-square)](#)
[![.PPTX](https://img.shields.io/badge/.PPTX-C8410C?style=flat-square)](#)

**Paste raw text or AI-generated output. Export a real, native Office file.**

[Live demo](https://morphly-beta.vercel.app) · [Report a bug](https://github.com/Abudora-0/morphly/issues)

</div>

---

Morphly converts pasted text — Markdown, or raw output from ChatGPT, Claude, Gemini, or anywhere else — into a fully formatted, native `.docx`, `.xlsx`, or `.pptx` file. No accounts, no third-party uploads: everything runs through your own Next.js server.

## Features

- **Three real export formats** — genuine Word, Excel, and PowerPoint files (not HTML-in-a-wrapper), each with format-appropriate structure: tables become real Excel sheets with autofilter, headings become real slide breaks, headings/lists/tables render with native Word styles.
- **One shared pipeline** — a single Markdown parser and intermediate schema feed all three generators, so behavior stays consistent across formats.
- **Smart Format** — an optional local-LLM pass (via [Ollama](https://ollama.com)) that cleans up messy, non-Markdown input before conversion.
- **Per-format configuration** — page size and title-page placement for Word, overview-sheet and header-freeze toggles for Excel, slide size and title-slide toggles for PowerPoint.
- **Image support** — `![alt](url)` embeds real images in the exported file, fetched and validated server-side (protocol allowlist, private-IP blocking, size/time limits — see [Security](#security)).
- **No accounts, no database** — paste, convert, download.

## How it works

One shared pipeline backs all three formats:

```
Pasted text
   │
   ▼
Parser (deterministic Markdown, or Smart Format via a local Ollama model)
   │
   ▼
MorphlyDocument (headings, paragraphs, lists, tables, quotes, code, images, dividers)
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

Run the test suite with:

```bash
npm test
```

## Smart Format (optional)

Smart Format uses a local [Ollama](https://ollama.com) model to restructure messy, non-Markdown input into clean Markdown before conversion. It's entirely optional — the deterministic parser works without it.

1. Install Ollama and pull a model: `ollama pull llama3.1`
2. Run `ollama serve`
3. Copy `.env.local.example` to `.env.local` and adjust `OLLAMA_HOST` / `OLLAMA_MODEL` if needed

This only works when Morphly itself is running locally — a deployed instance (e.g. on Vercel) has no network path to your machine's Ollama.

## Security

- **Rate limiting** and a 100,000-character input cap on both API routes.
- **Image fetching is SSRF-guarded**: only `http(s)` and `data:` URLs are allowed, the DNS-resolved IP is checked against private/reserved ranges (including cloud metadata addresses) before every request and after every redirect hop, and fetches are capped by size and time.
- A blocked or failed image degrades to a visible "unavailable" notice rather than silently failing the whole export.

## Project structure

- `app/api/convert` — POST `{ text, format, options }` → streams back the generated file
- `app/api/smart-format` — POST `{ text }` → cleaned Markdown via Ollama
- `components/workspace/` — the split-screen UI (source text, format tabs, per-format config, live structure preview)
- `lib/parser/` — Markdown → `MorphlyDocument` schema
- `lib/generators/` — `MorphlyDocument` → `.docx` / `.xlsx` / `.pptx`
- `lib/images/` — SSRF-safe image fetching and resolution
- `lib/llm/` — the Smart Format provider abstraction (Ollama today; swappable)

## Tech stack

Next.js (App Router) + TypeScript + Tailwind CSS, [`docx`](https://www.npmjs.com/package/docx), [`exceljs`](https://www.npmjs.com/package/exceljs), and [`pptxgenjs`](https://www.npmjs.com/package/pptxgenjs) for file generation, [`remark`](https://github.com/remarkjs/remark) for Markdown parsing, [Vitest](https://vitest.dev) for testing.

## License

[MIT](LICENSE)
