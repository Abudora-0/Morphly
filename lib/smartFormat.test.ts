import { afterEach, describe, expect, it } from "vitest";
import { isSmartFormatEnabled } from "@/lib/smartFormat";

const KEYS = ["SMART_FORMAT", "VERCEL", "OLLAMA_HOST"] as const;
const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

function setEnv(values: Partial<Record<(typeof KEYS)[number], string | undefined>>) {
  for (const key of KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const key of KEYS) {
    const value = original[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("isSmartFormatEnabled", () => {
  it("is on for local development", () => {
    setEnv({});
    expect(isSmartFormatEnabled()).toBe(true);
  });

  it("is off on a hosted deployment with no Ollama host", () => {
    setEnv({ VERCEL: "1" });
    expect(isSmartFormatEnabled()).toBe(false);
  });

  it("stays off when a hosted deployment points at localhost", () => {
    setEnv({ VERCEL: "1", OLLAMA_HOST: "http://127.0.0.1:11434" });
    expect(isSmartFormatEnabled()).toBe(false);
  });

  it("turns on when a hosted deployment names a reachable remote host", () => {
    setEnv({ VERCEL: "1", OLLAMA_HOST: "https://ollama.example.com" });
    expect(isSmartFormatEnabled()).toBe(true);
  });

  it("stays off when a hosted deployment has an unparseable host", () => {
    setEnv({ VERCEL: "1", OLLAMA_HOST: "not a url" });
    expect(isSmartFormatEnabled()).toBe(false);
  });

  it("honours an explicit flag over every other signal", () => {
    setEnv({ VERCEL: "1", SMART_FORMAT: "1" });
    expect(isSmartFormatEnabled()).toBe(true);

    setEnv({ SMART_FORMAT: "false" });
    expect(isSmartFormatEnabled()).toBe(false);
  });

  it("ignores an empty flag rather than reading it as off", () => {
    setEnv({ SMART_FORMAT: "" });
    expect(isSmartFormatEnabled()).toBe(true);
  });
});
