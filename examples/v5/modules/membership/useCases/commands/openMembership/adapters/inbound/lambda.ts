import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { readJsonBody, readHeaders, toApiGatewayResult } from "@arts-and-crafts/v5-aws";
import { buildCommand, runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import { toOpenMembershipCommand } from "../../command.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import { openMembershipSchema } from "./schema.ts";
import { openMembershipHooks } from "./hooks.ts";

export function createOpenMembershipLambdaHandler(handler: OpenMembershipHandler) {
  return (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> =>
    buildCommand({
      schema: openMembershipSchema,
      raw: readJsonBody(event),
      headers: readHeaders(event),
      toCommand: toOpenMembershipCommand,
    })
      .asyncAndThen((command) => runCommand(command, handler))
      .match(
        (command): APIGatewayProxyStructuredResultV2 => ({
          statusCode: 202,
          body: JSON.stringify({ accepted: true, id: command.payload.membershipId }),
        }),
        (error) => toApiGatewayResult(resolveError(error, openMembershipHooks)),
      );
}
