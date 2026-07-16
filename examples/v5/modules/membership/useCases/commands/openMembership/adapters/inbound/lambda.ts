import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseJsonBody } from "@arts-and-crafts/v5-aws";
import {
  parseSchema,
  correlationIdFromHeaders,
  causationIdFromHeaders,
} from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { toOpenMembershipCommand } from "../../command.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import { openMembershipSchema } from "./schema.ts";

export function createOpenMembershipLambdaHandler(handler: OpenMembershipHandler) {
  return (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const headers = event.headers ?? {};
    const metadata: Metadata = {
      correlationId: correlationIdFromHeaders(headers),
      causationId: causationIdFromHeaders(headers),
    };
    return parseJsonBody(event)
      .asyncAndThen(parseSchema(openMembershipSchema))
      .map((payload) => toOpenMembershipCommand({ payload, metadata }))
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
          if ("kind" in error)
            return {
              statusCode: 400,
              body: JSON.stringify({ code: error.code, reason: error.reason }),
            };
          return {
            statusCode: 400,
            body: JSON.stringify({ code: error.name, reason: error.message }),
          };
        },
      );
  };
}
