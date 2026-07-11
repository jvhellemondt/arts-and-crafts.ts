import { serve } from "@hono/node-server";
import { InMemoryEventStore } from "../shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "../shared/adapters/outbound/Outbox.InMemory.ts";
import { InMemoryProjectionStore } from "../shared/adapters/outbound/ProjectionStore.InMemory.ts";
import { InMemoryEmailGateway } from "../shared/adapters/outbound/EmailGateway.ts";
import { IntentRelay } from "../shared/adapters/outbound/IntentRelay.ts";
import { NotifyUserToVerifyEmailHandler } from "../modules/membership/useCases/policies/notifyUserToVerifyEmail/handler.ts";
import {
  emptyProjection,
  type ListMembershipsProjection,
} from "../modules/membership/useCases/queries/listMemberships/projection.ts";
import { ListMembershipsProjector } from "../modules/membership/useCases/queries/listMemberships/projector.ts";
import { createHonoApp } from "./apps/hono/index.ts";
import type { HandleIntent } from "@arts-and-crafts/v5/useCases/policy/capabilities";
import type { StoredEvent, OutboxEnvelope } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipEventV1 } from "../modules/membership/core/events/index.ts";
import type { MembershipIntents } from "../modules/membership/core/intents/index.ts";
import type { NotifyUserToVerifyEmailV1 } from "../modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type { OpenMembershipRejected } from "../modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";

const eventStoreDatasource = new Map<string, StoredEvent<MembershipEventV1>[]>([]);
const outboxDatasource = new Map<
  string,
  OutboxEnvelope<NotifyUserToVerifyEmailV1 | OpenMembershipRejected>[]
>([]);

const eventStore = new InMemoryEventStore<MembershipEventV1>(eventStoreDatasource);
const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>(outboxDatasource);

const emailGateway = new InMemoryEmailGateway();

const intentHandlers = new Map<string, HandleIntent<MembershipIntents>>([
  ["NotifyUserToVerifyEmail.v1", new NotifyUserToVerifyEmailHandler(emailGateway)],
]);
const intentRelay = new IntentRelay<MembershipIntents>(outbox, intentHandlers);
const listMembershipsStore = new InMemoryProjectionStore<ListMembershipsProjection>(
  emptyProjection,
);
const listMembershipsProjector = new ListMembershipsProjector(listMembershipsStore, eventStore);

const honoApp = createHonoApp(eventStore, outbox, listMembershipsStore);

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
