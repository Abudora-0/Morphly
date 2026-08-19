import { lookup } from "node:dns/promises";
import { imageSize } from "image-size";
import { isPrivateOrReservedIp } from "./ipSafety";
import { IMAGE_FETCH_TIMEOUT_MS, MAX_IMAGE_BYTES } from "@/lib/limits";
import type { ResolvedImage } from "@/lib/parser/schema";

const SUPPORTED_FORMATS = new Set(["png", "jpg", "gif"]); // intersection of what docx/xlsx/pptx can all embed
const MAX_REDIRECTS = 4;

/**
 * Resolves a markdown image URL (remote http(s) or a data: URI) into actual
 * decoded bytes + dimensions, ready to embed in an OOXML file. Returns null
 * on any failure — unreachable, too large, wrong format, blocked as
 * SSRF-unsafe, etc. — so a bad image degrades the document instead of
 * failing the whole conversion.
 *
 * Known limitation: the DNS-resolved IP is validated before each fetch, but
 * fetch() re-resolves DNS itself, leaving a narrow DNS-rebinding race where
 * a hostname could resolve differently between the check and the request.
 * Closing that fully would mean pinning the connection to the resolved IP
 * via a custom dispatcher — more machinery than this project's threat model
 * (a small public tool, not a high-value target) currently justifies. The
 * protocol allowlist, private-IP block, redirect re-validation, and
 * size/time limits below cover the realistic cases.
 */
export async function resolveImage(url: string): Promise<ResolvedImage | null> {
  try {
    const bytes = url.startsWith("data:") ? decodeDataUri(url) : await fetchRemoteImage(url);
    if (!bytes || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;

    const dimensions = imageSize(bytes);
    if (!dimensions.width || !dimensions.height) return null;
    if (!SUPPORTED_FORMATS.has(dimensions.type ?? "")) return null;

    return {
      data: bytes,
      format: dimensions.type as ResolvedImage["format"],
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch {
    return null;
  }
}

function decodeDataUri(uri: string): Buffer | null {
  const match = uri.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,([\s\S]+)$/);
  if (!match) return null;
  const buffer = Buffer.from(match[1], "base64");
  return buffer.length > 0 ? buffer : null;
}

async function fetchRemoteImage(rawUrl: string): Promise<Buffer | null> {
  let currentUrl = rawUrl;

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      return null;
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

    const ip = await resolveHostIp(parsed.hostname);
    if (!ip || isPrivateOrReservedIp(ip)) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(parsed.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": "Morphly-ImageFetch/1.0" },
      });
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return null;
      currentUrl = new URL(location, parsed).toString();
      continue; // loop re-validates protocol + IP for the new location
    }

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;

    const declaredLength = res.headers.get("content-length");
    if (declaredLength && Number(declaredLength) > MAX_IMAGE_BYTES) return null;

    return readBodyWithLimit(res, controller);
  }

  return null; // too many redirects
}

async function readBodyWithLimit(res: Response, controller: AbortController): Promise<Buffer | null> {
  const reader = res.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_IMAGE_BYTES) {
      controller.abort();
      return null;
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function resolveHostIp(hostname: string): Promise<string | null> {
  try {
    const result = await lookup(hostname);
    return result.address;
  } catch {
    return null;
  }
}
