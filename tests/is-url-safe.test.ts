import { describe, it, expect } from "vitest";
import { isUrlSafe } from "../convex/lib/auth";

describe("isUrlSafe", () => {
  // --- Should allow ---
  it("allows normal HTTP URLs", () => {
    expect(isUrlSafe("https://example.com")).toBe(true);
    expect(isUrlSafe("http://example.com/path?q=1")).toBe(true);
    expect(isUrlSafe("https://sub.domain.co.uk/foo")).toBe(true);
  });

  it("allows public IPs", () => {
    expect(isUrlSafe("http://8.8.8.8")).toBe(true);
    expect(isUrlSafe("https://1.1.1.1/dns-query")).toBe(true);
  });

  // --- Should block: protocol ---
  it("blocks non-http protocols", () => {
    expect(isUrlSafe("ftp://example.com")).toBe(false);
    expect(isUrlSafe("file:///etc/passwd")).toBe(false);
    expect(isUrlSafe("javascript:alert(1)")).toBe(false);
    expect(isUrlSafe("data:text/html,<h1>hi</h1>")).toBe(false);
  });

  // --- Should block: invalid URLs ---
  it("blocks invalid URLs", () => {
    expect(isUrlSafe("not-a-url")).toBe(false);
    expect(isUrlSafe("")).toBe(false);
  });

  // --- Should block: loopback ---
  it("blocks localhost", () => {
    expect(isUrlSafe("http://localhost")).toBe(false);
    expect(isUrlSafe("http://localhost:3000")).toBe(false);
  });

  it("blocks 127.x.x.x", () => {
    expect(isUrlSafe("http://127.0.0.1")).toBe(false);
    expect(isUrlSafe("http://127.255.255.255")).toBe(false);
  });

  // --- Should block: RFC 1918 private ranges ---
  it("blocks 10.x.x.x", () => {
    expect(isUrlSafe("http://10.0.0.1")).toBe(false);
    expect(isUrlSafe("http://10.255.0.1")).toBe(false);
  });

  it("blocks 172.16-31.x.x", () => {
    expect(isUrlSafe("http://172.16.0.1")).toBe(false);
    expect(isUrlSafe("http://172.31.255.255")).toBe(false);
  });

  it("allows 172 outside private range", () => {
    expect(isUrlSafe("http://172.15.0.1")).toBe(true);
    expect(isUrlSafe("http://172.32.0.1")).toBe(true);
  });

  it("blocks 192.168.x.x", () => {
    expect(isUrlSafe("http://192.168.0.1")).toBe(false);
    expect(isUrlSafe("http://192.168.1.100")).toBe(false);
  });

  // --- Should block: link-local ---
  it("blocks 169.254.x.x (link-local)", () => {
    expect(isUrlSafe("http://169.254.169.254")).toBe(false);
  });

  // --- Should block: special ---
  it("blocks 0.x.x.x", () => {
    expect(isUrlSafe("http://0.0.0.0")).toBe(false);
  });

  it("blocks CGNAT range (100.64-127.x.x)", () => {
    expect(isUrlSafe("http://100.64.0.1")).toBe(false);
    expect(isUrlSafe("http://100.127.255.255")).toBe(false);
  });

  it("allows 100.x outside CGNAT", () => {
    expect(isUrlSafe("http://100.63.0.1")).toBe(true);
    expect(isUrlSafe("http://100.128.0.1")).toBe(true);
  });

  it("blocks benchmarking range (198.18-19.x.x)", () => {
    expect(isUrlSafe("http://198.18.0.1")).toBe(false);
    expect(isUrlSafe("http://198.19.255.255")).toBe(false);
  });

  it("blocks TEST-NET ranges", () => {
    expect(isUrlSafe("http://192.0.2.1")).toBe(false);
    expect(isUrlSafe("http://198.51.100.1")).toBe(false);
    expect(isUrlSafe("http://203.0.113.1")).toBe(false);
  });

  // --- Should block: GCP metadata ---
  it("blocks GCP metadata endpoints", () => {
    expect(isUrlSafe("http://metadata.google.internal")).toBe(false);
    expect(isUrlSafe("http://metadata.google.com")).toBe(false);
  });

  // --- Should block: IPv6 ---
  it("blocks IPv6 loopback", () => {
    expect(isUrlSafe("http://[::1]")).toBe(false);
  });

  it("blocks IPv6 unique local (fc/fd)", () => {
    expect(isUrlSafe("http://[fc00::1]")).toBe(false);
    expect(isUrlSafe("http://[fd12:3456::1]")).toBe(false);
  });

  it("blocks IPv6 link-local (fe80::)", () => {
    expect(isUrlSafe("http://[fe80::1]")).toBe(false);
  });

  it("blocks IPv4-mapped IPv6", () => {
    expect(isUrlSafe("http://[::ffff:127.0.0.1]")).toBe(false);
    expect(isUrlSafe("http://[::ffff:192.168.1.1]")).toBe(false);
  });
});
