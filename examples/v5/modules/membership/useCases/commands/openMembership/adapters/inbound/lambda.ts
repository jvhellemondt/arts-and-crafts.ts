import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  parseJsonBody,
  causationIdFromHeaders,
  correlationIdFromHeaders,
} from "@arts-and-crafts/v5-aws";
import { parseSchema } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type {
  LoadDomainEvents,
  AppendEventsAndIntents,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipOpenedV1 } from "@examples/modules/membership/core/events/v1/MembershipOpenedV1.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { ResultAsync } from "neverthrow";
import { OpenMembershipHandler } from "../../handler.ts";
import { OpenMembershipRepository } from "../../repository.ts";
import { toOpenMembershipCommand } from "../../command.ts";
import { openMembershipSchema } from "./schema.ts";

export function createOpenMembershipLambdaHandler(
  eventStore: LoadDomainEvents<MembershipEventV1, ResultAsync<MembershipEventV1[], GatewayFailure>>,
  writer: AppendEventsAndIntents<
    MembershipOpenedV1,
    NotifyUserToVerifyEmailV1,
    ResultAsync<void, GatewayFailure>
  >,
) {
  const repository = new OpenMembershipRepository(eventStore);
  const handler = new OpenMembershipHandler(repository, writer);

  return (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    return ResultAsync.combine([
      parseJsonBody(event).asyncAndThen(parseSchema(openMembershipSchema)),
      correlationIdFromHeaders()(event),
      causationIdFromHeaders()(event),
    ])
      .map(([payload, ...metadata]) => ({
        payload,
        metadata: metadata.reduce((acc, value) => Object.assign(acc, value), {}) as Metadata,
      }))
      .map(toOpenMembershipCommand)
      .andThen((command) => handler.handle(command))
      .match(
        (decision): APIGatewayProxyStructuredResultV2 =>
          decision.accepted
            ? {
                statusCode: 202,
                body: JSON.stringify({
                  accepted: true,
                  id: decision.events[0].payload.membershipId,
                }),
              }
            : {
                statusCode: 409,
                body: JSON.stringify({
                  code: decision.rejection.code,
                  reason: decision.rejection.reason,
                }),
              },
        (error): APIGatewayProxyStructuredResultV2 => {
          if (Array.isArray(error))
            return { statusCode: 503, body: JSON.stringify({ code: "GATEWAY_FAILURE" }) };
          return {
            statusCode: 400,
            body: JSON.stringify({ code: error.code, reason: error.reason }),
          };
        },
      );
  };
}
