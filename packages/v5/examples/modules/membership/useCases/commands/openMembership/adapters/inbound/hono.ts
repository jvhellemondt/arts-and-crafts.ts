import { createOpenMembershipCommand } from "../../command.ts";
import { type Context } from "hono";
import { v7 as uuidv7 } from "uuid";
import { type AggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import type { ParsedHonoBody } from "@examples/shared/adapters/inbound/ParsedHonoBody.ts";
import type { OpenMembershipSchema } from "./schema.ts";
import type { OpenMembershipHandler } from "../../handler.ts";

export class OpenMembershipHonoAdapter {
  constructor(private readonly handler: OpenMembershipHandler) {}

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
    const result = await this.handler.handle(command);
    console.log({ result });
  }
}
