import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { createQuery } from "./createQuery.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const METADATA: Metadata = { correlationId: "c1", causationId: "ca1" };

describe("createQuery", () => {
  it("returns a query with the given type", () => {
    const query = createQuery("TestQuery", { value: "test" }, METADATA);
    expect(query.type).toBe("TestQuery");
  });

  it("returns a query with kind query", () => {
    const query = createQuery("TestQuery", { value: "test" }, METADATA);
    expect(query.kind).toBe("query");
  });

  it("returns a query with the provided payload", () => {
    const payload = { value: "test" };
    const query = createQuery("TestQuery", payload, METADATA);
    expect(query.payload).toBe(payload);
  });

  it("returns a query with the provided metadata", () => {
    const query = createQuery("TestQuery", { value: "test" }, METADATA);
    expect(query.metadata).toBe(METADATA);
  });

  it("returns a query with a UUIDv7 id", () => {
    const query = createQuery("TestQuery", { value: "test" }, METADATA);
    expect(query.id).toMatch(UUID_V7_PATTERN);
  });

  it("returns a query with a unique id on each call", () => {
    const first = createQuery("TestQuery", { value: "test" }, METADATA);
    const second = createQuery("TestQuery", { value: "test" }, METADATA);
    expect(first.id).not.toBe(second.id);
  });

  it("returns a query with a timestamp close to the current time", () => {
    const before = Date.now();
    const query = createQuery("TestQuery", { value: "test" }, METADATA);
    const after = Date.now();
    expect(query.timestamp).toBeGreaterThanOrEqual(before);
    expect(query.timestamp).toBeLessThanOrEqual(after);
  });
});
