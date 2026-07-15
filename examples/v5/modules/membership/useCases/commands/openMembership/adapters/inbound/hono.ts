import type { Context } from "hono";
import { readJsonBody, readHeaders, respond } from "@arts-and-crafts/v5-hono";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import {
  parsePayload,
  correlationIdFromHeaders,
  causationIdFromHeaders,
  resolveError,
} from "@arts-and-crafts/v5-utils/adapters/inbound";
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
import { toOpenMembershipCommand } from "../../command.ts";
import { openMembershipSchema } from "./schema.ts";
import { openMembershipHooks } from "./hooks.ts";

export function createOpenMembershipHonoHandler(
  eventStore: LoadDomainEvents<MembershipEventV1, Promise<MembershipEventV1[] | GatewayFailure>> &
    AppendToEventStore<MembershipEventV1, Promise<void | GatewayFailure>>,
  outbox: StageIntents<NotifyUserToVerifyEmailV1, Promise<void | GatewayFailure>>,
) {
  const repository = new OpenMembershipRepository(eventStore);
  const handler = new OpenMembershipHandler(repository, outbox);

  return async (c: Context) => {
    const headers = readHeaders(c);
    const metadata = {
      correlationId: correlationIdFromHeaders()(headers),
      causationId: causationIdFromHeaders()(headers),
    };
    return parsePayload(openMembershipSchema, await readJsonBody(c))
      .map((payload) => toOpenMembershipCommand(payload, metadata))
      .asyncAndThen((command) => runCommand(command, handler))
      .match(
        (command) => c.json({ accepted: true, id: command.payload.membershipId }, 202),
        (error) => respond(c, resolveError(error, openMembershipHooks)),
      );
  };
}
