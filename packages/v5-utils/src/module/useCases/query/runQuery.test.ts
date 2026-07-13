import type { Query } from "@arts-and-crafts/v5/useCases/query/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { runQuery } from "./runQuery.ts";
import { FailureError } from "../../adapters/inbound/FailureError.ts";

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
  it("returns the handler's data on success", async () => {
    const handler = handlerReturning<{ id: string }[]>([{ id: "1" }]);
    const data = await runQuery(TEST_QUERY, handler);
    expect(data).toEqual([{ id: "1" }]);
  });

  it("returns an empty array on success with no results", async () => {
    const handler = handlerReturning<{ id: string }[]>([]);
    const data = await runQuery(TEST_QUERY, handler);
    expect(data).toEqual([]);
  });

  it("throws a FailureError wrapping the failures", async () => {
    const handler = handlerReturning<{ id: string }[]>([FAILURE]);
    await expect(runQuery(TEST_QUERY, handler)).rejects.toThrow(FailureError);
  });
});
