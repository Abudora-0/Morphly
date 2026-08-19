import { NextRequest, NextResponse } from "next/server";
import { createOllamaProvider, getOllamaModelName } from "@/lib/llm/ollamaProvider";
import { LLMProviderError } from "@/lib/llm/provider";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { MAX_TEXT_LENGTH, SMART_FORMAT_RATE_LIMIT } from "@/lib/limits";
import { isSmartFormatEnabled } from "@/lib/smartFormat";

export async function POST(request: NextRequest) {
  // The UI hides the button when this is off; refuse here too so the
  // endpoint isn't left reachable only to fail against an absent Ollama.
  if (!isSmartFormatEnabled()) {
    return NextResponse.json({ error: "Smart Format is not available." }, { status: 404 });
  }

  const rateLimit = checkRateLimit(
    `smart-format:${getClientIp(request)}`,
    SMART_FORMAT_RATE_LIMIT.limit,
    SMART_FORMAT_RATE_LIMIT.windowMs,
  );
  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "Too many Smart Format requests. Please wait a bit before trying again." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const text = body?.text;

  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Missing text to format." }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `Text is too long (max ${MAX_TEXT_LENGTH.toLocaleString()} characters).` },
      { status: 413 },
    );
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
