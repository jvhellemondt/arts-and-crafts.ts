import {
  InMemoryEventStore,
  type TableName,
  type TableRow,
} from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import type { OutboxEnvelope } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { MembershipIntents } from "@examples/modules/membership/core/intents/index.ts";
import type { OpenMembershipRejected } from "@examples/modules/membership/useCases/commands/openMembership/rejections/MembershipAlreadyExists.ts";
import { OpenMembershipRepository } from "@examples/modules/membership/useCases/commands/openMembership/repository.ts";
import { OpenMembershipHandler } from "@examples/modules/membership/useCases/commands/openMembership/handler.ts";
import { createOpenMembershipLambdaHandler } from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/lambda.ts";

// Module-scope so a warm container reuses it across invocations, same as
// shell/apps/hono/main.ts. Not durable across cold starts — swap for a real
// EventStore/Outbox once the persistent backend is decided.
const eventStoreDatasource = new Map<TableName, TableRow<MembershipEventV1>[]>([]);
const outboxDatasource = new Map<
  string,
  OutboxEnvelope<MembershipIntents | OpenMembershipRejected>[]
>([]);

const eventStore = new InMemoryEventStore<MembershipEventV1>(eventStoreDatasource);
const outbox = new InMemoryOutbox<MembershipIntents, OpenMembershipRejected>(outboxDatasource);
const repository = new OpenMembershipRepository(eventStore);
const openMembershipHandler = new OpenMembershipHandler(repository, outbox);

export const handler = createOpenMembershipLambdaHandler(openMembershipHandler);
