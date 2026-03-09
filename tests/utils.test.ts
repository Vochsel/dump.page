import { describe, it, expect } from "vitest";
import { darkenHex, lightenHex } from "../src/lib/utils";

describe("darkenHex", () => {
  it("darkens white by 50%", () => {
    // 255 - round(255*0.5) = 255 - 128 = 127 = 0x7f
    expect(darkenHex("#ffffff", 0.5)).toBe("#7f7f7f");
  });

  it("darkens to black at amount 1", () => {
    expect(darkenHex("#ffffff", 1)).toBe("#000000");
  });

  it("clamps at 0 (no negative values)", () => {
    expect(darkenHex("#0a0a0a", 0.5)).toBe("#000000");
  });

  it("returns same color at amount 0", () => {
    expect(darkenHex("#ff8040", 0)).toBe("#ff8040");
  });

  it("handles mid-range colors", () => {
    // #808080 - 25% of 255 (64) = #404040
    expect(darkenHex("#808080", 0.25)).toBe("#404040");
  });
});

describe("lightenHex", () => {
  it("lightens black by 50%", () => {
    expect(lightenHex("#000000", 0.5)).toBe("#808080");
  });

  it("lightens to white at amount 1", () => {
    expect(lightenHex("#000000", 1)).toBe("#ffffff");
  });

  it("clamps at 255 (no overflow)", () => {
    expect(lightenHex("#f0f0f0", 0.5)).toBe("#ffffff");
  });

  it("returns same color at amount 0", () => {
    expect(lightenHex("#ff8040", 0)).toBe("#ff8040");
  });
});
