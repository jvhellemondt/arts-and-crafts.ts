import { describe, expect, it } from "vitest";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "./query.ts";

const VALID_PAYLOAD: ListMembershipsQueryPayload = listMembershipsQueryPayload.parse({
  status: "open",
});

describe("createListMembershipsQuery", () => {
  describe("listMembershipsQueryPayload", () => {
    it("parses an empty object (all fields optional)", () => {
      const result = listMembershipsQueryPayload.safeParse({});
      expect(result.success).toBe(true);
    });

    it("parses a valid status value", () => {
      const result = listMembershipsQueryPayload.safeParse({ status: "open" });
      expect(result.success).toBe(true);
    });

    it("rejects an invalid status value", () => {
      const result = listMembershipsQueryPayload.safeParse({ status: "unknown" });
      expect(result.success).toBe(false);
    });
  });

  it("returns a query carrying the provided payload", () => {
    const query = createListMembershipsQuery(VALID_PAYLOAD);
    expect(query.payload).toBe(VALID_PAYLOAD);
  });

  it("returns a query with status undefined by default", () => {
    const query = createListMembershipsQuery(listMembershipsQueryPayload.parse({}));
    expect(query.payload.status).toBeUndefined();
  });
});
