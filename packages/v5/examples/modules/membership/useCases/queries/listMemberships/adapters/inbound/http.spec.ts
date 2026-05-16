import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { HandleQuery } from "@useCases/query/capabilities/HandleQuery.ts";
import type { Context } from "hono";
import { randomUUID } from "node:crypto";
import type { MembershipSummary } from "../../projection.ts";
import type { ListMembershipsQuery } from "../../queries.ts";
import { ListMembershipsHonoAdapter } from "./http.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface CapturedResponse {
  status: number;
  body: unknown;
}

function makeContext(
  headers: Record<string, string | undefined> = {},
): { ctx: Context; captured: CapturedResponse } {
  const captured: CapturedResponse = { status: 0, body: undefined };
  const ctx = {
    req: {
      header: (name: string) => headers[name],
    },
    json: (body: unknown, status: number) => {
      captured.status = status;
      captured.body = body;
      return new Response(JSON.stringify(body), { status });
    },
  } as unknown as Context;
  return { ctx, captured };
}

describe("ListMembershipsHonoAdapter", () => {
  let result: MembershipSummary[] | GatewayFailure;
  let handler: HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>;
  let handledQueries: ListMembershipsQuery[];
  let adapter: ListMembershipsHonoAdapter;

  beforeEach(() => {
    handledQueries = [];
    result = [];
    handler = {
      async handle(query: ListMembershipsQuery) {
        handledQueries.push(query);
        return result;
      },
    };
    adapter = new ListMembershipsHonoAdapter(handler);
  });

  it("calls the handler exactly once per request", async () => {
    const { ctx } = makeContext();
    await adapter.handle(ctx);
    expect(handledQueries).toHaveLength(1);
  });

  it("uses X-Correlation-ID header as correlationId when present", async () => {
    const correlationId = randomUUID();
    const { ctx } = makeContext({ "X-Correlation-ID": correlationId });
    await adapter.handle(ctx);
    expect(handledQueries[0].metadata.correlationId).toBe(correlationId);
  });

  it("uses X-Request-ID header as causationId when present", async () => {
    const causationId = randomUUID();
    const { ctx } = makeContext({ "X-Request-ID": causationId });
    await adapter.handle(ctx);
    expect(handledQueries[0].metadata.causationId).toBe(causationId);
  });

  it("generates a UUIDv7 correlationId when X-Correlation-ID header is absent", async () => {
    const { ctx } = makeContext();
    await adapter.handle(ctx);
    expect(handledQueries[0].metadata.correlationId).toMatch(UUID_V7_PATTERN);
  });

  it("generates a UUIDv7 causationId when X-Request-ID header is absent", async () => {
    const { ctx } = makeContext();
    await adapter.handle(ctx);
    expect(handledQueries[0].metadata.causationId).toMatch(UUID_V7_PATTERN);
  });

  it("returns 200 with the list when the handler succeeds", async () => {
    const summary: MembershipSummary = {
      id: randomUUID(),
      name: "Ada Lovelace",
      email: "ada@example.com",
      status: "open",
    };
    result = [summary];
    const { ctx, captured } = makeContext();
    await adapter.handle(ctx);
    expect(captured.status).toBe(200);
    expect(captured.body).toEqual([summary]);
  });

  it("returns 503 with the failure reason when the handler returns a GatewayFailure", async () => {
    result = {
      type: "failure",
      kind: "GatewayFailure",
      gateway: "InMemoryProjectionStore",
      reason: "offline",
    };
    const { ctx, captured } = makeContext();
    await adapter.handle(ctx);
    expect(captured.status).toBe(503);
    expect(captured.body).toEqual({ error: "offline" });
  });
});
