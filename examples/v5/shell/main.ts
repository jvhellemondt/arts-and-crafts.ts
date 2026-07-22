import { serve } from "@hono/node-server";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { InMemoryDatasource } from "@examples/shared/adapters/outbound/InMemoryDatasource.ts";
import { InMemoryTransactionalWriter } from "@examples/shared/adapters/outbound/TransactionalWriter.InMemory.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import { InMemoryEmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import { IntentRelay } from "@examples/shared/adapters/outbound/IntentRelay.ts";
import { NotifyUserToVerifyEmailHandler } from "@examples/modules/membership/useCases/policies/notifyUserToVerifyEmail/handler.ts";
import {
  emptyProjection,
  type ListMembershipsProjection,
} from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import { ListMembershipsProjector } from "@examples/modules/membership/useCases/queries/listMemberships/projector.ts";
import { createHonoApp } from "./apps/hono/index.ts";
import type { HandleIntent } from "@arts-and-crafts/v5/useCases/policy/capabilities";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import type { OpenMembershipRejected } from "@examples/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";

// One shared datasource — the event store and outbox both write into it.
// InMemoryTransactionalWriter opens a transaction around events + intents so
// they commit together (or roll both back); writes outside that — e.g. a
// standalone rejection notification — commit immediately, as normal.
const datasource = new InMemoryDatasource();

const eventStore = new InMemoryEventStore<MembershipEventV1>(datasource);
const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>(datasource);
const openMembershipWriter = new InMemoryTransactionalWriter(
  eventStore,
  outbox,
  datasource,
  "OpenMembershipRejected",
);

const emailGateway = new InMemoryEmailGateway();

const intentHandlers = new Map<string, HandleIntent<MembershipIntents>>([
  ["NotifyUserToVerifyEmail.v1", new NotifyUserToVerifyEmailHandler(emailGateway)],
]);
const intentRelay = new IntentRelay<MembershipIntents>(outbox, intentHandlers);
const listMembershipsStore = new InMemoryProjectionStore<ListMembershipsProjection>(
  emptyProjection,
);
const listMembershipsProjector = new ListMembershipsProjector(listMembershipsStore, eventStore);

const honoApp = createHonoApp(eventStore, openMembershipWriter, listMembershipsStore);

const RELAY_INTERVAL_MS = 1000;
const relayTimer = setInterval(() => {
  intentRelay.relay().catch((err) => console.error("IntentRelay error:", err));
}, RELAY_INTERVAL_MS);

const PROJECTOR_INTERVAL_MS = 100;
const projectorTimer = setInterval(() => {
  listMembershipsProjector
    .tick()
    .catch((err) => console.error("ListMembershipsProjector error:", err));
}, PROJECTOR_INTERVAL_MS);

const PORT = 3000;
const server = serve({ fetch: honoApp.fetch, port: PORT }, (info) => {
  console.log(`Started development server: http://localhost:${info.port}`);
});

const shutdown = () => {
  clearInterval(relayTimer);
  clearInterval(projectorTimer);
  server.close(() => process.exit(0));
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
