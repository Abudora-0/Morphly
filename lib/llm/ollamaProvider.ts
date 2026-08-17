import { Ollama } from "ollama";
import { LLMProviderError, type LLMProvider } from "@/lib/llm/provider";

const DEFAULT_HOST = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.1";

const SYSTEM_PROMPT = `You are a text formatting engine. Reformat the user's raw text into clean, well-structured Markdown suitable for conversion into a Word document, Excel spreadsheet, or PowerPoint deck.

Rules:
- Preserve all factual content and meaning. Do not invent, remove, or summarize information.
- Infer sensible heading structure (# and ##) if the text implies sections but lacks explicit headings.
- Convert list-like content into proper Markdown bullet (-) or numbered (1.) lists.
- Convert tabular data into a proper Markdown table with a header row.
- Use **bold**, *italic*, and > blockquote where semantically appropriate, but don't overuse them.
- Output ONLY the resulting Markdown. No commentary, no preamble, no code fence wrapping the whole output.`;

export function getOllamaModelName(): string {
  return process.env.OLLAMA_MODEL || DEFAULT_MODEL;
}

export function createOllamaProvider(): LLMProvider {
  const host = process.env.OLLAMA_HOST || DEFAULT_HOST;
  const model = getOllamaModelName();
  const client = new Ollama({ host });

  return {
    async normalizeToMarkdown(rawText: string): Promise<string> {
      try {
        const response = await client.generate({
          model,
          system: SYSTEM_PROMPT,
          prompt: rawText,
          stream: false,
          options: { temperature: 0.2 },
        });
        return stripCodeFence(response.response.trim());
      } catch (err) {
        throw toFriendlyError(err, host, model);
      }
    },
  };
}

function stripCodeFence(text: string): string {
  const fenced = text.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1].trim() : text;
}

function toFriendlyError(err: unknown, host: string, model: string): LLMProviderError {
  const status = (err as { status_code?: number })?.status_code;

  if (status === 404) {
    return new LLMProviderError(
      `Model "${model}" isn't available on your local Ollama. Run \`ollama pull ${model}\`, or set OLLAMA_MODEL to a model you already have.`,
    );
  }

  const cause = (err as { cause?: { code?: string } })?.cause;
  const message = err instanceof Error ? err.message : String(err);
  const looksUnreachable = cause?.code === "ECONNREFUSED" || /fetch failed|ECONNREFUSED/i.test(message);

  if (looksUnreachable) {
    return new LLMProviderError(
      `Can't reach Ollama at ${host}. Make sure Ollama is running locally (\`ollama serve\`), or turn off Smart Format.`,
    );
  }

  return new LLMProviderError(`Smart Format failed: ${message}`);
}
