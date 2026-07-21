import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryDatasource } from "@examples/shared/adapters/outbound/InMemoryDatasource.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import {
  emptyProjection,
  type ListMembershipsProjection,
} from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import { ListMembershipsProjector } from "@examples/modules/membership/useCases/queries/listMemberships/projector.ts";
import { createListMembershipsLambdaHandler } from "@examples/modules/membership/useCases/queries/listMemberships/adapters/inbound/lambda.ts";

// Module-scope so a warm container reuses it across invocations, same as
// shell/apps/hono/main.ts. Not durable across cold starts, and not shared
// with the openMembership function's event store — swap for a real,
// centrally shared EventStore/ProjectionStore once the persistent backend
// is decided.
const datasource = new InMemoryDatasource();
const eventStore = new InMemoryEventStore<MembershipEventV1>(datasource);
const listMembershipsStore = new InMemoryProjectionStore<ListMembershipsProjection>(
  emptyProjection,
);
const listMembershipsProjector = new ListMembershipsProjector(listMembershipsStore, eventStore);

const invoke = createListMembershipsLambdaHandler(listMembershipsStore);

export const handler = async (event: APIGatewayProxyEventV2) => {
  await listMembershipsProjector.tick();
  return invoke(event);
};
