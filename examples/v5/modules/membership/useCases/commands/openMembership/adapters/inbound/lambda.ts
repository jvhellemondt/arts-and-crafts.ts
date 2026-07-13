import middy, { type MiddlewareObj } from "@middy/core";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  parseJsonBodyMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  toCommandMiddleware,
  type WithCommand,
} from "@arts-and-crafts/v5-aws";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import { toOpenMembershipCommand, type OpenMembershipCommand } from "../../command.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import { openMembershipSchema } from "./schema.ts";
import { openMembershipHooks } from "./hooks.ts";

type Event = APIGatewayProxyEventV2 & WithCommand<OpenMembershipCommand>;

export function createOpenMembershipLambdaHandler(handler: OpenMembershipHandler) {
  return middy<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>()
    .use(parseJsonBodyMiddleware(openMembershipSchema))
    .use(correlationIdMiddleware())
    .use(causationIdMiddleware())
    .use(toCommandMiddleware(toOpenMembershipCommand))
    .use({
      onError: (request) => {
        const outcome = resolveError(request.error, openMembershipHooks);
        request.response = { statusCode: outcome.status, body: JSON.stringify(outcome.body) };
      },
    } satisfies MiddlewareObj<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>)
    .handler(async (rawEvent) => {
      // The middleware above stash this field onto the event, which middy's
      // own types have no way to track across the chain — cast once, here.
      const event = rawEvent as Event;
      const command = await runCommand(event.__command, handler);
      return {
        statusCode: 202,
        body: JSON.stringify({ accepted: true, id: command.payload.membershipId }),
      };
    });
}
