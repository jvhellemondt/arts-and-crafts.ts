import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { runQuery } from "./runQuery.ts";

interface TestQueryPayload {
  status?: string;
}

type TestQuery = Query<"TestQuery", TestQueryPayload>;

const METADATA: Metadata = { correlationId: "c1", causationId: "ca1" };

const TEST_QUERY: TestQuery = {
  id: "qry-1",
  type: "TestQuery",
  kind: "query",
  payload: {},
  metadata: METADATA,
  timestamp: Date.now(),
};

const FAILURE: GatewayFailure = {
  kind: "failure",
  code: "GATEWAY_FAILURE",
  gateway: "TestGateway",
  reason: "boom",
};

function handlerReturning<TData>(
  result: GatewayFailure[] | TData,
): HandleQuery<TestQuery, Promise<GatewayFailure[] | TData>> {
  return { handle: async () => result };
}

describe("runQuery", () => {
  it("returns Ok with the handler's data on success", async () => {
    const result = await runQuery(TEST_QUERY, handlerReturning<{ id: string }[]>([{ id: "1" }]));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([{ id: "1" }]);
  });

  it("returns Ok with an empty array on success with no results", async () => {
    const result = await runQuery(TEST_QUERY, handlerReturning<{ id: string }[]>([]));
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual([]);
  });

  it("returns Err with the failures", async () => {
    const result = await runQuery(TEST_QUERY, handlerReturning<{ id: string }[]>([FAILURE]));
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual([FAILURE]);
  });
});
