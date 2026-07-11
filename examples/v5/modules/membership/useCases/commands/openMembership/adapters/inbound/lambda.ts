import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import { createOpenMembershipCommand } from "../../command.ts";
import { v7 as uuidv7 } from "uuid";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";
import type { OpenMembershipHandler } from "../../handler.ts";
import { openMembershipSchema } from "./schema.ts";

export function createOpenMembershipInboundLambdaAdapter(handler: OpenMembershipHandler) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const parsed = openMembershipSchema.safeParse(
      event.body ? JSON.parse(event.body) : undefined,
    );
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify(parsed.error.flatten()) };
    }

    const correlationId = event.headers["x-correlation-id"] ?? uuidv7();
    const causationId = event.headers["x-request-id"] ?? uuidv7();
    const command = createOpenMembershipCommand(
      { ...parsed.data, membershipId: aggregateId.parse(uuidv7()) },
      { correlationId, causationId },
    );

    const result = await handler.handle(command);
    if ("kind" in result && result.kind === "rejection") {
      return { statusCode: 404, body: JSON.stringify({ accepted: false, code: result.code }) };
    }
    if (Array.isArray(result) && result.length) {
      return { statusCode: 500, body: JSON.stringify({ code: "UNEXPECTED_SERVER_ERROR" }) };
    }
    return {
      statusCode: 202,
      body: JSON.stringify({ accepted: true, id: command.payload.membershipId }),
    };
  };
}
