import { describe, expect, it } from "vitest";
import { email } from "./Email.ts";

describe("Email", () => {
  it("parses a valid email address", () => {
    const result = email.safeParse("user@example.com");
    expect(result.success).toBe(true);
  });

  it("parses an email with subdomain", () => {
    const result = email.safeParse("user@mail.example.com");
    expect(result.success).toBe(true);
  });

  it("rejects an email without @", () => {
    const result = email.safeParse("notanemail");
    expect(result.success).toBe(false);
  });

  it("rejects an email without domain", () => {
    const result = email.safeParse("user@");
    expect(result.success).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = email.safeParse("");
    expect(result.success).toBe(false);
  });

  it("rejects a non-string value", () => {
    const result = email.safeParse(42);
    expect(result.success).toBe(false);
  });
});
