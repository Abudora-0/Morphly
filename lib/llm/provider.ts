// Abstraction over "clean up raw text into well-structured Markdown".
// Ollama is the only implementation today (local-only, see ollamaProvider.ts),
// but a cloud provider could implement the same interface without touching
// the smart-format route or the deterministic markdown pipeline downstream.

export interface LLMProvider {
  normalizeToMarkdown(rawText: string): Promise<string>;
}

export class LLMProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMProviderError";
  }
}
