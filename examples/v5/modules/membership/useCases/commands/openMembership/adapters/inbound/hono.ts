import type { Context } from "hono";
import {
  parseJsonBody,
  causationIdFromHeaders,
  correlationIdFromHeaders,
} from "@arts-and-crafts/v5-hono";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { parseSchema } from "@arts-and-crafts/v5-utils/adapters/inbound";
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
import { openMembershipCommandPayload, toOpenMembershipCommand } from "../../command.ts";
import { openMembershipSchema } from "./schema.ts";
import { ok, Result, ResultAsync } from "neverthrow";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";

export function createOpenMembershipHonoHandler(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<NotifyUserToVerifyEmailV1, Promise<void | GatewayFailure>>,
) {
  const repository = new OpenMembershipRepository(eventStore);
  const handler = new OpenMembershipHandler(repository, outbox);

  return async (c: Context) => {
    return ResultAsync.combine([
      parseJsonBody(c).andThen(parseSchema(openMembershipSchema)),
      correlationIdFromHeaders()(c),
      causationIdFromHeaders()(c),
    ])
      .map(([payload, ...metadata]) => ({
        payload,
        metadata: metadata.reduce((acc, value) => Object.assign(acc, value), {}) as Metadata,
      }))
      .map(toOpenMembershipCommand)
      .andThen(handler.handle.bind(handler))
      .match(
        (data) => {
          return c.json({ data });
        },
        (err) => {
          return c.json({ err });
        },
      );
  };
}
