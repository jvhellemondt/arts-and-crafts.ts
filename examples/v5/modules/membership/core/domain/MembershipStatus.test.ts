import { describe, expect, it } from "vitest";
import { membershipStatus } from "./MembershipStatus.ts";

describe("MembershipStatus", () => {
  it.each(["initial", "open", "active", "closed"])("parses '%s'", (status) => {
    const result = membershipStatus.safeParse(status);
    expect(result.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = membershipStatus.safeParse("pending");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = membershipStatus.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a non-string value", () => {
    const result = membershipStatus.safeParse(1);
    expect(result.success).toBe(false);
  });

  it("rejects null", () => {
    const result = membershipStatus.safeParse(null);
    expect(result.success).toBe(false);
  });
});
