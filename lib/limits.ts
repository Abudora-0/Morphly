// Shared abuse-prevention constants for the public API routes.

export const MAX_TEXT_LENGTH = 100_000; // ~15-20k words, generous for a real document, not for a script

export const CONVERT_RATE_LIMIT = { limit: 20, windowMs: 5 * 60 * 1000 }; // 20 conversions / 5 min / IP
export const SMART_FORMAT_RATE_LIMIT = { limit: 10, windowMs: 5 * 60 * 1000 }; // heavier (LLM call)

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB per image
export const MAX_IMAGES_PER_DOCUMENT = 20; // caps fan-out fetch amplification from a single paste
export const IMAGE_FETCH_TIMEOUT_MS = 8_000;
