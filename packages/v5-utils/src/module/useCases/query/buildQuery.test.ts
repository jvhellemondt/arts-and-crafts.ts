import { ZodError, z } from "zod";
import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { buildQuery } from "./buildQuery.ts";

interface TestPayload {
  status?: string;
}

type TestQuery = Query<"TestQuery", TestPayload>;

function toTestQuery(payload: TestPayload, metadata: Metadata): TestQuery {
  return {
    id: "qry-1",
    type: "TestQuery",
    kind: "query",
    payload,
    metadata,
    timestamp: 0,
  };
}

const schema = z.object({ status: z.enum(["open", "closed"]).optional() });

describe("buildQuery", () => {
  it("returns Ok with the query built from payload and header metadata", () => {
    const result = buildQuery({
      schema,
      raw: { status: "open" },
      headers: { "x-correlation-id": "corr-2", "x-request-id": "cause-2" },
      toQuery: toTestQuery,
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual({
      id: "qry-1",
      type: "TestQuery",
      kind: "query",
      payload: { status: "open" },
      metadata: { correlationId: "corr-2", causationId: "cause-2" },
      timestamp: 0,
    });
  });

  it("returns Err with the ZodError for an invalid payload", () => {
    const result = buildQuery({
      schema,
      raw: { status: "bogus" },
      headers: {},
      toQuery: toTestQuery,
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ZodError);
  });
});
