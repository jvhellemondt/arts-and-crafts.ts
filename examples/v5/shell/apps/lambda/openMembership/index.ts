import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { InMemoryDatasource } from "@examples/shared/adapters/outbound/InMemoryDatasource.ts";
import { InMemoryTransactionalWriter } from "@examples/shared/adapters/outbound/TransactionalWriter.InMemory.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import type { OpenMembershipRejected } from "@examples/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";
import { createOpenMembershipLambdaHandler } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/lambda.ts";

// Module-scope so a warm container reuses it across invocations, same as
// shell/apps/hono/main.ts. Not durable across cold starts — swap for a real
// EventStore/Outbox once the persistent backend is decided.
const datasource = new InMemoryDatasource();

const eventStore = new InMemoryEventStore<MembershipEventV1>(datasource);
const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>(datasource);
const writer = new InMemoryTransactionalWriter(eventStore, outbox, datasource);

export const handler = createOpenMembershipLambdaHandler(eventStore, writer, outbox);
