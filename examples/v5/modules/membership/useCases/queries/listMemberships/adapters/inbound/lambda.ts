import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { readQueryParams, readHeaders, toApiGatewayResult } from "@arts-and-crafts/v5-aws";
import { buildQuery, runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import { createListMembershipsQuery, listMembershipsQueryPayload } from "../../query.ts";
import type { ListMembershipsHandler } from "../../handler.ts";
import { listMembershipsHooks } from "./hooks.ts";

export function createListMembershipsLambdaHandler(handler: ListMembershipsHandler) {
  return (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> =>
    buildQuery({
      schema: listMembershipsQueryPayload,
      raw: readQueryParams(event),
      headers: readHeaders(event),
      toQuery: createListMembershipsQuery,
    })
      .asyncAndThen((query) => runQuery(query, handler))
      .match(
        (data): APIGatewayProxyStructuredResultV2 => ({
          statusCode: 200,
          body: JSON.stringify(data),
        }),
        (error) => toApiGatewayResult(resolveError(error, listMembershipsHooks)),
      );
}
