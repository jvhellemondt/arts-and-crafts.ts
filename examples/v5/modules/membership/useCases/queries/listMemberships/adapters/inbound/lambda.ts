import middy, { type MiddlewareObj } from "@middy/core";
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import {
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  type WithPayload,
  type WithMetadataFields,
} from "@arts-and-crafts/v5-aws";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "../../query.ts";
import type { ListMembershipsHandler } from "../../handler.ts";
import { listMembershipsHooks } from "./hooks.ts";

type Event = APIGatewayProxyEventV2 & WithPayload<ListMembershipsQueryPayload> & WithMetadataFields;

export function createListMembershipsLambdaHandler(handler: ListMembershipsHandler) {
  return middy<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>()
    .use(parseQueryMiddleware(listMembershipsQueryPayload))
    .use(correlationIdMiddleware())
    .use(causationIdMiddleware())
    .use({
      onError: (request) => {
        const outcome = resolveError(request.error, listMembershipsHooks);
        request.response = { statusCode: outcome.status, body: JSON.stringify(outcome.body) };
      },
    } satisfies MiddlewareObj<APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2>)
    .handler(async (rawEvent) => {
      // The middleware above stash these fields onto the event, which middy's
      // own types have no way to track across the chain — cast once, here.
      const event = rawEvent as Event;
      const query = createListMembershipsQuery(event.__payload, {
        correlationId: event.__correlationId,
        causationId: event.__causationId,
      });
      const data = await runQuery(query, handler);
      return { statusCode: 200, body: JSON.stringify(data) };
    });
}
