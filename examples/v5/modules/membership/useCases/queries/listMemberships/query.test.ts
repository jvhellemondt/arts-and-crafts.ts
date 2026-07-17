import { describe, expect, it } from "vitest";
import { listMembershipsQuery } from "./query.ts";

describe("listMembershipsQuery", () => {
  it("parses an empty object (all fields optional)", () => {
    const result = listMembershipsQuery.safeParse({});
    expect(result.success).toBe(true);
  });

  it("parses a valid status value", () => {
    const result = listMembershipsQuery.safeParse({ status: "open" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid status value", () => {
    const result = listMembershipsQuery.safeParse({ status: "unknown" });
    expect(result.success).toBe(false);
  });

  it("leaves status undefined when omitted", () => {
    expect(listMembershipsQuery.parse({}).status).toBeUndefined();
  });
});
