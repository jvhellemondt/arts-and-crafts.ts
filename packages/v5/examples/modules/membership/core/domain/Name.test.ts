import { describe, expect, it } from "vitest";
import { name } from "./Name.ts";

describe("Name", () => {
  it("parses a valid name string", () => {
    const result = name.safeParse("Alice");
    expect(result.success).toBe(true);
  });

  it("parses a name with spaces", () => {
    const result = name.safeParse("Alice van Wonderland");
    expect(result.success).toBe(true);
  });

  it("parses an empty string", () => {
    const result = name.safeParse("");
    expect(result.success).toBe(true);
  });

  it("rejects a non-string value", () => {
    const result = name.safeParse(42);
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = name.safeParse(null);
    expect(result.success).toBe(false);
  });
});
