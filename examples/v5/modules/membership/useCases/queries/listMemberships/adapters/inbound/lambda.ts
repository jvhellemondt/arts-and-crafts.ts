import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseSchema } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { LoadProjection } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { ResultAsync } from "neverthrow";
import type { ListMembershipsProjection } from "../../projection.ts";
import { createListMembershipsQuery, listMembershipsQueryPayload } from "../../query.ts";
import { ListMembershipsHandler } from "../../handler.ts";

export function createListMembershipsLambdaHandler(
  store: LoadProjection<
    ListMembershipsProjection,
    ResultAsync<ListMembershipsProjection, GatewayFailure>
  >,
) {
  const handler = new ListMembershipsHandler(store);

  return (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    return parseSchema(listMembershipsQueryPayload)({ body: event.queryStringParameters ?? {} })
      .map((payload) => createListMembershipsQuery(payload))
      .andThen((query) => handler.handle(query))
      .match(
        (data): APIGatewayProxyStructuredResultV2 => ({
          statusCode: 200,
          body: JSON.stringify(data),
        }),
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
