import {
  createOpenMembershipCommand,
  openMembershipCommandPayload,
  type OpenMembershipCommand,
} from "../../command.ts";
import { type Context } from "hono";
import { v7 as uuidv7 } from "uuid";
import { type AggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import type { ParsedHonoBody } from "@examples/shared/adapters/inbound/ParsedHonoBody.ts";
import type { HandleCommand } from "@useCases/command/capabilities/HandleCommand.ts";
import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { Rejection } from "@core/shapes/Rejection.ts";

export class OpenMembershipHonoAdapter {
  constructor(
    private readonly handler: HandleCommand<
      OpenMembershipCommand,
      Promise<(GatewayFailure | AppendConflict)[] | Rejection>
    >,
  ) {}

  async handle(
    c: Context<{}, "membership/open", ParsedHonoBody<"json", typeof openMembershipCommandPayload>>,
    id: AggregateId["parsed"],
  ): Promise<void> {
    const correlationId = c.req.header("X-Correlation-ID") ?? uuidv7();
    const causationId = c.req.header("X-Request-ID") ?? uuidv7();
    const body = c.req.valid("json");
    const command = createOpenMembershipCommand(id, body, {
      correlationId,
      causationId,
    });
    await this.handler.handle(command);
  }
}
