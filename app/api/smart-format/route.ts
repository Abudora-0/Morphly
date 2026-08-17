import { NextRequest, NextResponse } from "next/server";
import { createOllamaProvider, getOllamaModelName } from "@/lib/llm/ollamaProvider";
import { LLMProviderError } from "@/lib/llm/provider";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const text = body?.text;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing text to format." }, { status: 400 });
  }

  try {
    const provider = createOllamaProvider();
    const markdown = await provider.normalizeToMarkdown(text);
    return NextResponse.json({ markdown, model: getOllamaModelName() });
  } catch (err) {
    if (err instanceof LLMProviderError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "Smart Format failed unexpectedly." }, { status: 500 });
  }
}
