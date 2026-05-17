import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { HandleQuery } from "@useCases/query/capabilities/HandleQuery.ts";
import type { ParsedHonoBody } from "@examples/shared/adapters/inbound/ParsedHonoBody.ts";
import type { MembershipSummary } from "../../projection.ts";
import { listMembershipsQueryPayload, type ListMembershipsQuery } from "../../query.ts";
import type { Context } from "hono";
import { v7 as uuidv7 } from "uuid";
import { ListMembershipsHonoAdapter } from "./hono.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const VALID_PAYLOAD = listMembershipsQueryPayload.parse({ status: "open" });

type HonoCtx = Context<{}, "memberships", ParsedHonoBody<"query", typeof listMembershipsQueryPayload>>;

function makeContext(headers: Record<string, string | undefined> = {}): HonoCtx {
  return {
    req: {
      header: (name: string) => headers[name],
      valid: () => VALID_PAYLOAD,
    },
    json: (body: unknown, status: number) => new Response(JSON.stringify(body), { status }),
  } as unknown as HonoCtx;
}

describe("ListMembershipsHonoAdapter", () => {
  let handledQueries: ListMembershipsQuery[];
  let handler: HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>;
  let adapter: ListMembershipsHonoAdapter;

  beforeEach(() => {
    handledQueries = [];
    handler = {
      async handle(query: ListMembershipsQuery) {
        handledQueries.push(query);
        return [];
      },
    };
    adapter = new ListMembershipsHonoAdapter(handler);
  });

  it("calls handler.handle with the query payload", async () => {
    await adapter.handle(makeContext());
    expect(handledQueries).toHaveLength(1);
    expect(handledQueries[0].payload).toEqual(VALID_PAYLOAD);
  });

  it("uses X-Correlation-ID header as correlationId when present", async () => {
    const correlationId = uuidv7();
    await adapter.handle(makeContext({ "X-Correlation-ID": correlationId }));
    expect(handledQueries[0].metadata.correlationId).toBe(correlationId);
  });

  it("uses X-Request-ID header as causationId when present", async () => {
    const causationId = uuidv7();
    await adapter.handle(makeContext({ "X-Request-ID": causationId }));
    expect(handledQueries[0].metadata.causationId).toBe(causationId);
  });

  it("generates a UUIDv7 correlationId when X-Correlation-ID header is absent", async () => {
    await adapter.handle(makeContext());
    expect(handledQueries[0].metadata.correlationId).toMatch(UUID_V7_PATTERN);
  });

  it("generates a UUIDv7 causationId when X-Request-ID header is absent", async () => {
    await adapter.handle(makeContext());
    expect(handledQueries[0].metadata.causationId).toMatch(UUID_V7_PATTERN);
  });
});
