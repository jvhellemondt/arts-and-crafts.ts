import { describe, expect, it } from "vitest";
import { tosAcceptance } from "./TosAcceptance.ts";

describe("TosAcceptance", () => {
  it("parses a valid tos acceptance", () => {
    const result = tosAcceptance.safeParse({
      version: "1.0",
      signedAt: "2024-01-15T10:30:00.000Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when version is missing", () => {
    const result = tosAcceptance.safeParse({
      signedAt: "2024-01-15T10:30:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when signedAt is missing", () => {
    const result = tosAcceptance.safeParse({
      version: "1.0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when version is empty", () => {
    const result = tosAcceptance.safeParse({
      version: "",
      signedAt: "2024-01-15T10:30:00.000Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when signedAt is not a valid datetime", () => {
    const result = tosAcceptance.safeParse({
      version: "1.0",
      signedAt: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-object value", () => {
    const result = tosAcceptance.safeParse("1.0");
    expect(result.success).toBe(false);
  });
});
