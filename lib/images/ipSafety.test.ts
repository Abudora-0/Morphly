import { describe, expect, it } from "vitest";
import { isPrivateOrReservedIp } from "./ipSafety";

describe("isPrivateOrReservedIp", () => {
  it("blocks loopback, private, and link-local IPv4 ranges", () => {
    expect(isPrivateOrReservedIp("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("10.0.0.5")).toBe(true);
    expect(isPrivateOrReservedIp("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("172.31.255.255")).toBe(true);
    expect(isPrivateOrReservedIp("192.168.1.1")).toBe(true);
    expect(isPrivateOrReservedIp("169.254.169.254")).toBe(true); // cloud metadata endpoint
    expect(isPrivateOrReservedIp("0.0.0.0")).toBe(true);
  });

  it("does not block ordinary public IPv4 addresses", () => {
    expect(isPrivateOrReservedIp("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIp("1.1.1.1")).toBe(false);
    expect(isPrivateOrReservedIp("172.15.255.255")).toBe(false); // just outside 172.16/12
    expect(isPrivateOrReservedIp("172.32.0.0")).toBe(false); // just outside 172.16/12
  });

  it("blocks loopback and unique-local/link-local IPv6", () => {
    expect(isPrivateOrReservedIp("::1")).toBe(true);
    expect(isPrivateOrReservedIp("fe80::1")).toBe(true);
    expect(isPrivateOrReservedIp("fd00::1")).toBe(true);
  });

  it("unwraps IPv4-mapped IPv6 addresses and validates the embedded IPv4", () => {
    expect(isPrivateOrReservedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIp("::ffff:8.8.8.8")).toBe(false);
  });

  it("treats unrecognizable input as unsafe", () => {
    expect(isPrivateOrReservedIp("not-an-ip")).toBe(true);
  });
});
