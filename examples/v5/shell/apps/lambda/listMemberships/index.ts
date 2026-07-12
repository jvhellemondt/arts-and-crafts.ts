import middy from "@middy/core";
import {
  parseQueryMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  type WithPayload,
  type WithMetadataFields,
} from "@arts-and-crafts/v5-aws";
import { runQuery } from "@arts-and-crafts/v5-utils/useCases/query";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { APIGatewayProxyEventV2, Context } from "aws-lambda";
import {
  InMemoryEventStore,
  type TableName,
  type TableRow,
} from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import {
  emptyProjection,
  type ListMembershipsProjection,
} from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import { ListMembershipsProjector } from "@examples/modules/membership/useCases/queries/listMemberships/projector.ts";
import { ListMembershipsHandler } from "@examples/modules/membership/useCases/queries/listMemberships/handler.ts";
import {
  createListMembershipsQuery,
  listMembershipsQueryPayload,
  type ListMembershipsQueryPayload,
} from "@examples/modules/membership/useCases/queries/listMemberships/query.ts";

// Module-scope so a warm container reuses it across invocations, same as
// shell/apps/hono/main.ts. Not durable across cold starts, and not shared
// with the openMembership function's event store — swap for a real,
// centrally shared EventStore/ProjectionStore once the persistent backend
// is decided.
const eventStoreDatasource = new Map<TableName, TableRow<MembershipEventV1>[]>([]);
const eventStore = new InMemoryEventStore<MembershipEventV1>(eventStoreDatasource);
const listMembershipsStore = new InMemoryProjectionStore<ListMembershipsProjection>(
  emptyProjection,
);
const listMembershipsProjector = new ListMembershipsProjector(listMembershipsStore, eventStore);
const listMembershipsHandler = new ListMembershipsHandler(listMembershipsStore);

type Event = APIGatewayProxyEventV2 & WithPayload<ListMembershipsQueryPayload> & WithMetadataFields;

const invoke = middy()
  .use(parseQueryMiddleware(listMembershipsQueryPayload))
  .use(correlationIdMiddleware())
  .use(causationIdMiddleware())
  .use({
    onError: (request) => {
      const outcome = resolveError(request.error, { onFailure: () => [503] });
      request.response = { statusCode: outcome.status, body: JSON.stringify(outcome.body) };
    },
  })
  .handler(async (event: Event) => {
    const data = await runQuery(createListMembershipsQuery, listMembershipsHandler)(
      event.__payload,
      { correlationId: event.__correlationId, causationId: event.__causationId },
    );
    return { statusCode: 200, body: JSON.stringify(data) };
  });

export const handler = async (event: APIGatewayProxyEventV2, context: Context) => {
  await listMembershipsProjector.tick();
  return invoke(event, context);
};
