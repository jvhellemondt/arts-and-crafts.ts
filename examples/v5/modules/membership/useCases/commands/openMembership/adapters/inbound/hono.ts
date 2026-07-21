import type { Context } from "hono";
import {
  parseJsonBody,
  causationIdFromHeaders,
  correlationIdFromHeaders,
} from "@arts-and-crafts/v5-hono";
import { parseSchema } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type {
  LoadDomainEvents,
  PersistEventsAndIntents,
  StageNotifications,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { OpenMembershipRejected } from "../../rejections/MembershipAlreadyExists.ts";
import { ResultAsync } from "neverthrow";
import { OpenMembershipHandler } from "../../handler.ts";
import { OpenMembershipRepository } from "../../repository.ts";
import { toOpenMembershipCommand } from "../../command.ts";
import { openMembershipSchema } from "./schema.ts";

export function createOpenMembershipHonoHandler(
  eventStore: LoadDomainEvents<MembershipEventV1, ResultAsync<MembershipEventV1[], GatewayFailure>>,
  writer: PersistEventsAndIntents<
    MembershipOpenedV1,
    NotifyUserToVerifyEmailV1,
    ResultAsync<void, GatewayFailure>
  >,
  notifications: StageNotifications<OpenMembershipRejected, ResultAsync<void, GatewayFailure>>,
) {
  const repository = new OpenMembershipRepository(eventStore);
  const handler = new OpenMembershipHandler(repository, writer, notifications);

  return (c: Context) => {
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
      .andThen((command) => handler.handle(command))
      .match(
        (decision) =>
          decision.accepted
            ? c.json({ accepted: true, id: decision.events[0].payload.membershipId }, 202)
            : c.json({ code: decision.rejection.code, reason: decision.rejection.reason }, 409),
        (error) => {
          if (Array.isArray(error)) return c.json({ code: "GATEWAY_FAILURE" }, 503);
          return c.json({ code: error.code, reason: error.reason }, 400);
        },
      );
  };
}
