import middy from "@middy/core";
import { v7 as uuidv7 } from "uuid";
import {
  parseJsonBodyMiddleware,
  correlationIdMiddleware,
  causationIdMiddleware,
  type WithPayload,
  type WithMetadataFields,
} from "@arts-and-crafts/v5-aws";
import { runCommand } from "@arts-and-crafts/v5-utils/useCases/command";
import { resolveError } from "@arts-and-crafts/v5-utils/adapters/inbound";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
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
import { createOpenMembershipCommand } from "@examples/modules/membership/useCases/commands/openMembership/command.ts";
import {
  openMembershipSchema,
  type OpenMembershipSchemaPayload,
} from "@examples/modules/membership/useCases/commands/openMembership/adapters/inbound/schema.ts";
import { aggregateId } from "@examples/modules/membership/core/domain/AggregateId.ts";

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

type Event = APIGatewayProxyEventV2 & WithPayload<OpenMembershipSchemaPayload> & WithMetadataFields;

export const handler = middy()
  .use(parseJsonBodyMiddleware(openMembershipSchema))
  .use(correlationIdMiddleware())
  .use(causationIdMiddleware())
  .use({
    onError: (request) => {
      const outcome = resolveError(request.error, {
        onRejection: () => [404],
        onFailure: () => [500],
      });
      request.response = { statusCode: outcome.status, body: JSON.stringify(outcome.body) };
    },
  })
  .handler(async (event: Event) => {
    const command = await runCommand(
      (payload: OpenMembershipSchemaPayload, metadata) =>
        createOpenMembershipCommand(
          { ...payload, membershipId: aggregateId.parse(uuidv7()) },
          metadata,
        ),
      openMembershipHandler,
    )(event.__payload, { correlationId: event.__correlationId, causationId: event.__causationId });
    return {
      statusCode: 202,
      body: JSON.stringify({ accepted: true, id: command.payload.membershipId }),
    };
  });
