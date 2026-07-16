import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  parseSchema,
  correlationIdFromHeaders,
  causationIdFromHeaders,
} from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { Metadata } from "@arts-and-crafts/v5/core/shapes";
import { createListMembershipsQuery, listMembershipsQueryPayload } from "../../query.ts";
import type { ListMembershipsHandler } from "../../handler.ts";

export function createListMembershipsLambdaHandler(handler: ListMembershipsHandler) {
  return (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> => {
    const headers = event.headers ?? {};
    const metadata: Metadata = {
      correlationId: correlationIdFromHeaders(headers),
      causationId: causationIdFromHeaders(headers),
    };
    return parseSchema(listMembershipsQueryPayload)({ body: event.queryStringParameters ?? {} })
      .map((payload) => createListMembershipsQuery(payload, metadata))
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
