import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { HandleQuery } from "@arts-and-crafts/v5/useCases/query/capabilities";
import { isFailure } from "@examples/shared/utils/isFailure.ts";
import { v7 as uuidv7 } from "uuid";
import type { MembershipSummary } from "../../projection.ts";
import { createListMembershipsQuery, type ListMembershipsQuery } from "../../query.ts";
import { listMembershipsQueryPayload } from "../../query.ts";

export function createListMembershipsInboundLambdaAdapter(
  handler: HandleQuery<ListMembershipsQuery, Promise<MembershipSummary[] | GatewayFailure>>,
) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const parsed = listMembershipsQueryPayload.safeParse(event.queryStringParameters ?? {});
    if (!parsed.success) {
      return { statusCode: 400, body: JSON.stringify(parsed.error.flatten()) };
    }

    const correlationId = event.headers["x-correlation-id"] ?? uuidv7();
    const causationId = event.headers["x-request-id"] ?? uuidv7();
    const query = createListMembershipsQuery(parsed.data, { correlationId, causationId });

    const result = await handler.handle(query);
    if (isFailure(result)) {
      return { statusCode: 503, body: JSON.stringify({ error: result.reason }) };
    }
    return { statusCode: 200, body: JSON.stringify(result) };
  };
}
