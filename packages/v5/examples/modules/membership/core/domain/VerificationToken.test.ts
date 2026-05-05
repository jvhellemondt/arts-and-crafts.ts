import { describe, expect, it } from "vitest";
import { verificationToken } from "./VerificationToken.ts";

const VALID_UUID_V7 = "01965c36-4e6c-7d5e-aeb8-76e0a80e8b8f";
const VALID_UUID_V4 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

describe("VerificationToken", () => {
  it("parses a valid UUIDv7", () => {
    const result = verificationToken.safeParse(VALID_UUID_V7);
    expect(result.success).toBe(true);
  });

  it("rejects a UUIDv4", () => {
    const result = verificationToken.safeParse(VALID_UUID_V4);
    expect(result.success).toBe(false);
  });

  it("rejects a plain string", () => {
    const result = verificationToken.safeParse("not-a-uuid");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = verificationToken.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a non-string value", () => {
    const result = verificationToken.safeParse(123);
    expect(result.success).toBe(false);
  });
});
