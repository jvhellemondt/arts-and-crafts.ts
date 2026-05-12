import { name } from "@examples/modules/membership/core/domain/Name.ts";
import { email } from "@examples/modules/membership/core/domain/Email.ts";
import { createOpenMembershipCommand } from "../../command.ts";
import { sleep } from "bun";
import { type Context } from "hono";
import { v7 as uuidv7 } from "uuid";
import z from "zod";
import { type AggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import type { ParsedHonoBody } from "@examples/shared/adapters/inbound/ParsedHonoBody.ts";

export const schema = z.object({
  name,
  email,
});

export async function handle(
  c: Context<{}, "membership/open", ParsedHonoBody<typeof schema>>,
  aggregateId: AggregateId["parsed"],
): Promise<void> {
  const correlationId = c.req.header("X-Correlation-ID") ?? uuidv7();
  const causationId = c.req.header("X-Request-ID") ?? uuidv7();
  const { body } = c.req.valid("json");
  const command = createOpenMembershipCommand(aggregateId, body, {
    correlationId,
    causationId,
  });
  console.log({ command });

  await sleep(1);
}
