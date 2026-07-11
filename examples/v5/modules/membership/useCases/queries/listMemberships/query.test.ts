import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { describe, expect, it } from "vitest";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "./query.ts";

const VALID_PAYLOAD: ListMembershipsQueryPayload = listMembershipsQueryPayload.parse({
  status: "open",
});

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_METADATA: Metadata = {
  correlationId: "corr-123",
  causationId: "cause-456",
};

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

  it("returns a query with type ListMemberships", () => {
    const query = createListMembershipsQuery(VALID_PAYLOAD, VALID_METADATA);
    expect(query.type).toBe("ListMemberships");
  });

  it("returns a query with kind query", () => {
    const query = createListMembershipsQuery(VALID_PAYLOAD, VALID_METADATA);
    expect(query.kind).toBe("query");
  });

  it("returns a query with the provided metadata", () => {
    const query = createListMembershipsQuery(VALID_PAYLOAD, VALID_METADATA);
    expect(query.metadata).toBe(VALID_METADATA);
  });

  it("returns a query with status undefined by default", () => {
    const query = createListMembershipsQuery(listMembershipsQueryPayload.parse({}), VALID_METADATA);
    expect(query.payload.status).toBeUndefined();
  });

  it("returns a query with a UUIDv7 id", () => {
    const query = createListMembershipsQuery(VALID_PAYLOAD, VALID_METADATA);
    expect(query.id).toMatch(UUID_V7_PATTERN);
  });

  it("returns a query with a unique id on each call", () => {
    const first = createListMembershipsQuery(VALID_PAYLOAD, VALID_METADATA);
    const second = createListMembershipsQuery(VALID_PAYLOAD, VALID_METADATA);
    expect(first.id).not.toBe(second.id);
  });

  it("returns a query with a timestamp close to the current time", () => {
    const before = Date.now();
    const query = createListMembershipsQuery(VALID_PAYLOAD, VALID_METADATA);
    const after = Date.now();
    expect(query.timestamp).toBeGreaterThanOrEqual(before);
    expect(query.timestamp).toBeLessThanOrEqual(after);
  });
});
