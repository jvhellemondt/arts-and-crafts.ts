import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { createHonoApp } from "./apps/hono/index.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";

const eventBus = {};

const eventStore = new InMemoryEventStore<MembershipEventV1>();
const outbox = new InMemoryOutbox();

const honoApp = createHonoApp(eventStore, outbox);

export default {
  port: 3000,
  fetch: honoApp.fetch,
};
