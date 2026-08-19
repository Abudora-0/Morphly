import { describe, expect, it } from "vitest";
import http from "node:http";
import { resolveImage } from "./resolveImage";

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
    // 127.0.0.1 is a loopback literal — dns.lookup resolves it without any
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
});
