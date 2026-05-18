import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { InMemoryProjectionStore } from "@examples/shared/adapters/outbound/ProjectionStore.InMemory.ts";
import { InMemoryEmailGateway } from "@examples/shared/adapters/outbound/EmailGateway.ts";
import { IntentRelay } from "@examples/shared/useCases/policy/IntentRelay.ts";
import { NotifyUserToVerifyEmailHandler } from "@examples/modules/membership/useCases/policies/notifyUserToVerifyEmail/handler.ts";
import {
  emptyProjection,
  type ListMembershipsProjection,
} from "@examples/modules/membership/useCases/queries/listMemberships/projection.ts";
import { ListMembershipsProjector } from "@examples/modules/membership/useCases/queries/listMemberships/projector.ts";
import { createHonoApp } from "./apps/hono/index.ts";
import type { HandleIntent } from "@useCases/policy/capabilities/HandleIntent.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";

const eventStore = new InMemoryEventStore<MembershipEventV1>();

const outbox = new InMemoryOutbox<MembershipIntents>();

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

const shutdown = () => {
  clearInterval(relayTimer);
  clearInterval(projectorTimer);
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default {
  port: 3000,
  fetch: honoApp.fetch,
};
