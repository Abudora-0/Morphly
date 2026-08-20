import { lookup } from "node:dns/promises";
import { imageSize } from "image-size";
import { isPrivateOrReservedIp } from "./ipSafety";
import { IMAGE_FETCH_TIMEOUT_MS, MAX_IMAGE_BYTES } from "@/lib/limits";
import type { ResolvedImage } from "@/lib/parser/schema";

const SUPPORTED_FORMATS = new Set(["png", "jpg", "gif"]); // intersection of what docx/xlsx/pptx can all embed
const MAX_REDIRECTS = 4;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Identifies the byte stream as one of the three formats we can embed, using
 * its own signature rather than the server's Content-Type (which only has to
 * start with "image/" to get this far).
 *
 * This runs *before* image-size sees the bytes on purpose. image-size picks a
 * parser from the magic bytes, and its ICNS, JXL, and HEIF parsers have
 * published infinite-loop DoS advisories affecting every released version
 * (the advisories cover <= 2.0.2, which is the latest). Since a remote host
 * chooses what bytes it returns, sniffing first is what keeps those parsers
 * unreachable; the allowlist alone did not, because it only ran on the result.
 */
function sniffEmbeddableFormat(bytes: Buffer): "png" | "jpg" | "gif" | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return "png";
  // JPEG: SOI marker followed by any of the JFIF/EXIF/raw variants.
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 6) {
    const header = bytes.subarray(0, 6).toString("latin1");
    if (header === "GIF87a" || header === "GIF89a") return "gif";
  }
  return null;
}

/**
 * Resolves a markdown image URL (remote http(s) or a data: URI) into actual
 * decoded bytes + dimensions, ready to embed in an OOXML file. Returns null
 * on any failure (unreachable, too large, wrong format, blocked as
 * SSRF-unsafe, and so on), so a bad image degrades the document instead of
 * failing the whole conversion.
 *
 * Known limitation: the DNS-resolved IP is validated before each fetch, but
 * fetch() re-resolves DNS itself, leaving a narrow DNS-rebinding race where
 * a hostname could resolve differently between the check and the request.
 * Closing that fully would mean pinning the connection to the resolved IP
 * via a custom dispatcher, which is more machinery than this project's threat model
 * (a small public tool, not a high-value target) currently justifies. The
 * protocol allowlist, private-IP block, redirect re-validation, and
 * size/time limits below cover the realistic cases.
 */
export async function resolveImage(url: string): Promise<ResolvedImage | null> {
  try {
    const bytes = url.startsWith("data:") ? decodeDataUri(url) : await fetchRemoteImage(url);
    if (!bytes || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) return null;

    // Gate on our own signature check before image-size parses anything.
    if (!sniffEmbeddableFormat(bytes)) return null;

    const dimensions = imageSize(bytes);
    if (!dimensions.width || !dimensions.height) return null;
    // Kept as a second opinion: if image-size disagrees with the signature,
    // the file is malformed enough not to embed.
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
