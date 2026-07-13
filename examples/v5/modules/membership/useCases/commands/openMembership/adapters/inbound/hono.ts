import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { v7 as uuidv7 } from "uuid";
import type { PipelineEnv } from "@arts-and-crafts/v5-hono";
import {
  parseJsonBodyMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
} from "@arts-and-crafts/v5-hono";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { StageIntents } from "@arts-and-crafts/v5/core/capabilities";
import type {
  LoadDomainEvents,
  AppendToEventStore,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { createOpenMembershipCommand } from "../../command.ts";
import { OpenMembershipHandler } from "../../handler.ts";
import { OpenMembershipRepository } from "../../repository.ts";
import { openMembershipSchema, type OpenMembershipSchemaPayload } from "./schema.ts";
import { openMembershipHooks } from "./hooks.ts";

export function openMembershipHonoHandler(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<NotifyUserToVerifyEmailV1, Promise<void | GatewayFailure>>,
) {
  const repository = new OpenMembershipRepository(eventStore);
  const handler = new OpenMembershipHandler(repository, outbox);

  const app = new Hono<PipelineEnv>();

  app.post(
    "/",
    parseJsonBodyMiddleware(openMembershipSchema),
    correlationIdMiddleware(),
    causationIdMiddleware(),
    async (c) => {
      const command = await runCommand(
        (payload: OpenMembershipSchemaPayload, metadata) =>
          createOpenMembershipCommand(
            { ...payload, membershipId: aggregateId.parse(uuidv7()) },
            metadata,
          ),
        handler,
      )(c.get("payload") as OpenMembershipSchemaPayload, {
        correlationId: c.get("correlationId"),
        causationId: c.get("causationId"),
      });
      return c.json({ accepted: true, id: command.payload.membershipId }, { status: 202 });
    },
  );

  app.onError((err, c) => {
    const outcome = resolveError(err, openMembershipHooks);
    return c.json(outcome.body, { status: outcome.status as ContentfulStatusCode });
  });

  return app;
}
