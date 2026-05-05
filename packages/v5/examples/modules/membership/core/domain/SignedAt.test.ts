import { describe, expect, it } from "vitest";
import { signedAt } from "./SignedAt.ts";

describe("SignedAt", () => {
  it("parses a valid ISO datetime with UTC offset", () => {
    const result = signedAt.safeParse("2024-01-15T10:30:00.000Z");
    expect(result.success).toBe(true);
  });

  it("parses a valid ISO datetime with an explicit timezone offset", () => {
    const result = signedAt.safeParse("2024-06-01T12:00:00+02:00");
    expect(result.success).toBe(true);
  });

  it("rejects a date-only string", () => {
    const result = signedAt.safeParse("2024-01-15");
    expect(result.success).toBe(false);
  });

  it("rejects an arbitrary string", () => {
    const result = signedAt.safeParse("not a date");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = signedAt.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a non-string value", () => {
    const result = signedAt.safeParse(Date.now());
    expect(result.success).toBe(false);
  });
});
