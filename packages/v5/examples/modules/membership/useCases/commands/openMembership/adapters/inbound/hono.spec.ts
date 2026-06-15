import { OpenMembershipHonoAdapter } from "./hono.ts";
import { aggregateId as aggregateIdSchema } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { v7 as uuidv7 } from "uuid";
import type { Context } from "hono";
import type { ParsedHonoBody } from "@examples/shared/adapters/inbound/ParsedHonoBody.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";
import type { OpenMembershipCommand, openMembershipCommandPayload } from "../../command.ts";
import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import { MEMBERSHIP_AGGREGATE_NAME } from "@examples/modules/membership/core/AggregateTypes.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const aggregateId = aggregateIdSchema.parse(uuidv7());

const VALID_BODY = { name: "Jane Doe", email: "jane@example.com" };

type HonoCtx = Context<
  {},
  "membership/open",
  ParsedHonoBody<"json", typeof openMembershipCommandPayload>
>;

function makeContext(headers: Record<string, string | undefined> = {}): HonoCtx {
  return {
    req: {
      header: (name: string) => headers[name],
      valid: () => VALID_BODY,
    },
  } as unknown as HonoCtx;
}

describe("OpenMembershipHonoAdapter", () => {
  let handler: HandleCommand<OpenMembershipCommand, Promise<GatewayFailure[] | Rejection>>;
  let adapter: OpenMembershipHonoAdapter;
  let handledCommands: OpenMembershipCommand[];

  beforeEach(() => {
    handledCommands = [];
    handler = {
      async handle(command: OpenMembershipCommand): Promise<GatewayFailure[] | Rejection> {
        handledCommands.push(command);
        return [];
      },
    };
    adapter = new OpenMembershipHonoAdapter(handler);
  });

  it("calls handler.handle with the correct aggregateId", async () => {
    await adapter.handle(makeContext(), aggregateId);
    expect(handledCommands).toHaveLength(1);
    expect(handledCommands[0].criteria).toStrictEqual([
      createStreamKey(MEMBERSHIP_AGGREGATE_NAME, aggregateId),
    ]);
  });

  it("calls handler.handle with the body as payload", async () => {
    await adapter.handle(makeContext(), aggregateId);
    expect(handledCommands).toHaveLength(1);
    expect(handledCommands[0].payload).toEqual(VALID_BODY);
  });

  it("uses X-Correlation-ID header as correlationId when present", async () => {
    const correlationId = uuidv7();
    await adapter.handle(makeContext({ "X-Correlation-ID": correlationId }), aggregateId);
    expect(handledCommands).toHaveLength(1);
    expect(handledCommands[0].metadata.correlationId).toBe(correlationId);
  });

  it("uses X-Request-ID header as causationId when present", async () => {
    const causationId = uuidv7();
    await adapter.handle(makeContext({ "X-Request-ID": causationId }), aggregateId);
    expect(handledCommands).toHaveLength(1);
    expect(handledCommands[0].metadata.causationId).toBe(causationId);
  });

  it("generates a UUIDv7 correlationId when X-Correlation-ID header is absent", async () => {
    await adapter.handle(makeContext(), aggregateId);
    expect(handledCommands).toHaveLength(1);
    expect(handledCommands[0].metadata.correlationId).toMatch(UUID_V7_PATTERN);
  });

  it("generates a UUIDv7 causationId when X-Request-ID header is absent", async () => {
    await adapter.handle(makeContext(), aggregateId);
    expect(handledCommands).toHaveLength(1);
    expect(handledCommands[0].metadata.causationId).toMatch(UUID_V7_PATTERN);
  });
});
