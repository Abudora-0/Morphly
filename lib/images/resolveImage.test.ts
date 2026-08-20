import { beforeEach, describe, expect, it, vi } from "vitest";
import http from "node:http";
import { imageSize } from "image-size";
import { resolveImage } from "./resolveImage";

// Spied but still calling through, so every other test keeps real behaviour
// while the sniffing tests below can assert the parser was never reached.
vi.mock("image-size", async (importOriginal) => {
  const actual = await importOriginal<typeof import("image-size")>();
  return { imageSize: vi.fn(actual.imageSize) };
});

// A real, minimal 1x1 transparent PNG.
const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

describe("resolveImage", () => {
  it("decodes a data: URI without any network access", async () => {
    const result = await resolveImage(`data:image/png;base64,${PNG_1X1_BASE64}`);
    expect(result).not.toBeNull();
    expect(result?.format).toBe("png");
    expect(result?.width).toBe(1);
    expect(result?.height).toBe(1);
  });

  it("rejects a malformed data: URI", async () => {
    expect(await resolveImage("data:image/png;base64,not-valid-base64-content-!!!")).toBeNull();
    expect(await resolveImage("data:text/plain;base64,aGVsbG8=")).toBeNull();
  });

  it("rejects non-http(s) protocols", async () => {
    expect(await resolveImage("file:///etc/passwd")).toBeNull();
    expect(await resolveImage("ftp://example.com/image.png")).toBeNull();
  });

  it("refuses to fetch a URL that resolves to a private/loopback address (SSRF guard)", async () => {
    // 127.0.0.1 is a loopback literal, so dns.lookup resolves it without any
    // real network access, so this proves the IP-safety check actually
    // gates the fetch path, not just the pure isPrivateOrReservedIp helper.
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(Buffer.from(PNG_1X1_BASE64, "base64"));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const result = await resolveImage(`http://127.0.0.1:${port}/image.png`);
      expect(result).toBeNull();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe("format sniffing", () => {
    // image-size chooses a parser from the magic bytes, and its ICNS, JXL and
    // HEIF parsers have infinite-loop DoS advisories with no fixed release.
    // These assert the bytes are rejected on their signature, so those parsers
    // are never handed anything, whatever Content-Type a remote host claims.
    const HOSTILE = {
      icns: Buffer.concat([Buffer.from("icns", "latin1"), Buffer.alloc(64)]),
      // ISO-BMFF box header with an HEIF brand.
      heif: Buffer.concat([
        Buffer.from([0, 0, 0, 0x18]),
        Buffer.from("ftypheic", "latin1"),
        Buffer.alloc(64),
      ]),
      jxl: Buffer.concat([Buffer.from([0xff, 0x0a]), Buffer.alloc(64)]),
      bmp: Buffer.concat([Buffer.from("BM", "latin1"), Buffer.alloc(64)]),
      svg: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', "latin1"),
    };

    beforeEach(() => {
      vi.mocked(imageSize).mockClear();
    });

    it.each(Object.entries(HOSTILE))(
      "never hands %s bytes to the parser",
      async (_name, bytes) => {
        const uri = `data:image/png;base64,${bytes.toString("base64")}`;

        expect(await resolveImage(uri)).toBeNull();
        // The point of the fix: rejecting the result is not enough, because
        // reaching the parser at all is what can hang.
        expect(imageSize).not.toHaveBeenCalled();
      },
    );

    it("still parses the formats we can actually embed", async () => {
      const result = await resolveImage(`data:image/png;base64,${PNG_1X1_BASE64}`);

      expect(result?.format).toBe("png");
      expect(imageSize).toHaveBeenCalledOnce();
    });

    it("never hands the parser bytes too short to carry any signature", async () => {
      expect(await resolveImage(`data:image/png;base64,${Buffer.from([0x89]).toString("base64")}`)).toBeNull();
      expect(imageSize).not.toHaveBeenCalled();
    });
  });
});
