import { createOpenMembershipCommand, type OpenMembershipCommand } from "../../command.ts";
import { type Context } from "hono";
import { v7 as uuidv7 } from "uuid";
import { type AggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import type { ParsedHonoBody } from "@examples/shared/adapters/inbound/ParsedHonoBody.ts";
import type { OpenMembershipSchema } from "./schema.ts";
import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";

export class OpenMembershipHonoAdapter {
  constructor(
    private readonly handler: HandleCommand<
      OpenMembershipCommand,
      Promise<GatewayFailure[] | Rejection>
    >,
  ) {}

  async handle(
    c: Context<{}, "membership/open", ParsedHonoBody<typeof OpenMembershipSchema>>,
    aggregateId: AggregateId["parsed"],
  ): Promise<void> {
    const correlationId = c.req.header("X-Correlation-ID") ?? uuidv7();
    const causationId = c.req.header("X-Request-ID") ?? uuidv7();
    const body = c.req.valid("json");
    const command = createOpenMembershipCommand(aggregateId, body, {
      correlationId,
      causationId,
    });
    await this.handler.handle(command);
  }
}
