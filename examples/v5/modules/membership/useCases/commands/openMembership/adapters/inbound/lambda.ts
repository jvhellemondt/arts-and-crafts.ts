import middy from "@middy/core";
import { v7 as uuidv7 } from "uuid";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  parseJsonBodyMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  type WithPayload,
  type WithMetadataFields,
} from "@arts-and-crafts/v5-aws";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import { createOpenMembershipCommand } from "../../command.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import { openMembershipSchema, type OpenMembershipSchemaPayload } from "./schema.ts";
import { openMembershipHooks } from "./hooks.ts";

type Event = APIGatewayProxyEventV2 & WithPayload<OpenMembershipSchemaPayload> & WithMetadataFields;

export function createOpenMembershipLambdaHandler(handler: OpenMembershipHandler) {
  return middy()
    .use(parseJsonBodyMiddleware(openMembershipSchema))
    .use(correlationIdMiddleware())
    .use(causationIdMiddleware())
    .use({
      onError: (request) => {
        const outcome = resolveError(request.error, openMembershipHooks);
        request.response = { statusCode: outcome.status, body: JSON.stringify(outcome.body) };
      },
    })
    .handler(async (event: Event) => {
      const command = await runCommand(
        (payload: OpenMembershipSchemaPayload, metadata) =>
          createOpenMembershipCommand(
            { ...payload, membershipId: aggregateId.parse(uuidv7()) },
            metadata,
          ),
        handler,
      )(event.__payload, {
        correlationId: event.__correlationId,
        causationId: event.__causationId,
      });
      return {
        statusCode: 202,
        body: JSON.stringify({ accepted: true, id: command.payload.membershipId }),
      };
    });
}
