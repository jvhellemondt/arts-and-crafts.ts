import middy from "@middy/core";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
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
  return middy()
    .use(parseQueryMiddleware(listMembershipsQueryPayload))
    .use(correlationIdMiddleware())
    .use(causationIdMiddleware())
    .use({
      onError: (request) => {
        const outcome = resolveError(request.error, listMembershipsHooks);
        request.response = { statusCode: outcome.status, body: JSON.stringify(outcome.body) };
      },
    })
    .handler(async (event: Event) => {
      const data = await runQuery(createListMembershipsQuery, handler)(event.__payload, {
        correlationId: event.__correlationId,
        causationId: event.__causationId,
      });
      return { statusCode: 200, body: JSON.stringify(data) };
    });
}
