import { describe, expect, it } from "vitest";
import { tosVersion } from "./TosVersion.ts";

describe("TosVersion", () => {
  it("parses a valid version string", () => {
    const result = tosVersion.safeParse("1.0");
    expect(result.success).toBe(true);
  });

  it("parses a single character version", () => {
    const result = tosVersion.safeParse("v");
    expect(result.success).toBe(true);
  });

  it("rejects an empty string", () => {
    const result = tosVersion.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a non-string value", () => {
    const result = tosVersion.safeParse(1);
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = tosVersion.safeParse(null);
    expect(result.success).toBe(false);
  });
});
