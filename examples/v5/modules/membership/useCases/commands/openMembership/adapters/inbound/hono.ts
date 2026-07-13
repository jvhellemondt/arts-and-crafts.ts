import { createFactory } from "hono/factory";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseJsonBodyMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  toCommandMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type {
  LoadDomainEvents,
  AppendToEventStore,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { OpenMembershipHandler } from "../../handler.ts";
import { OpenMembershipRepository } from "../../repository.ts";
import { toOpenMembershipCommand, type OpenMembershipCommand } from "../../command.ts";
import { openMembershipSchema } from "./schema.ts";

const factory = createFactory<PipelineEnv>();

export function createOpenMembershipHonoHandler(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<NotifyUserToVerifyEmailV1, Promise<void | GatewayFailure>>,
) {
  const repository = new OpenMembershipRepository(eventStore);
  const handler = new OpenMembershipHandler(repository, outbox);

  return factory.createHandlers(
    parseJsonBodyMiddleware(openMembershipSchema),
    correlationIdMiddleware(),
    causationIdMiddleware(),
    toCommandMiddleware(toOpenMembershipCommand),
    async (c) => {
      const command = await runCommand(c.get("command") as OpenMembershipCommand, handler);
      return c.json({ accepted: true, id: command.payload.membershipId }, { status: 202 });
    },
  );
}
