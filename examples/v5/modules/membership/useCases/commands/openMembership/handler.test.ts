import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import {
  InMemoryDatasource,
  OUTBOX_TABLE,
} from "@examples/shared/adapters/outbound/InMemoryDatasource.ts";
import { InMemoryTransactionalWriter } from "@examples/shared/adapters/outbound/TransactionalWriter.InMemory.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import type {
  MembershipAlreadyExists,
  OpenMembershipRejected,
} from "./rejections/MembershipAlreadyExists.ts";
import {
  createOpenMembershipCommand,
  openMembershipCommandPayload,
  type OpenMembershipCommand,
} from "./command.ts";
import { OpenMembershipHandler } from "./handler.ts";
import { randomUUID } from "node:crypto";
import { OpenMembershipRepository } from "./repository.ts";
import { v7 as uuidv7 } from "uuid";
import type { OutboxEnvelope } from "@arts-and-crafts/v5/adapters/outbound/shapes";

const command = createOpenMembershipCommand(
  openMembershipCommandPayload.parse({
    membershipId: uuidv7(),
    name: "Jane Doe",
    email: "jane@example.com",
  }),
  { correlationId: randomUUID(), causationId: randomUUID() },
);

describe("OpenMembershipHandler", () => {
  let datasource: InMemoryDatasource;
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let outbox: InMemoryOutbox<NotifyUserToVerifyEmailV1, OpenMembershipRejected>;
  let writer: InMemoryTransactionalWriter<
    OpenMembershipCommand,
    MembershipEventV1,
    NotifyUserToVerifyEmailV1,
    MembershipAlreadyExists,
    OpenMembershipRejected
  >;
  let repository: OpenMembershipRepository;
  let handler: OpenMembershipHandler;

  beforeEach(() => {
    datasource = new InMemoryDatasource();
    eventStore = new InMemoryEventStore<MembershipEventV1>(datasource);
    outbox = new InMemoryOutbox<NotifyUserToVerifyEmailV1, OpenMembershipRejected>(datasource);
    writer = new InMemoryTransactionalWriter(eventStore, outbox, datasource);
    repository = new OpenMembershipRepository(eventStore);
    handler = new OpenMembershipHandler(repository, writer);
  });

  it("returns an accepted decision when the membership is successfully opened", async () => {
    const decision = (await handler.handle(command))._unsafeUnwrap();
    expect(decision.accepted).toBe(true);
  });

  it("returns a rejected decision (in the Ok channel) when the membership already exists", async () => {
    await handler.handle(command);

    const decision = (await handler.handle(command))._unsafeUnwrap();

    expect(decision).toMatchObject({
      accepted: false,
      rejection: {
        code: "MEMBERSHIP_ALREADY_EXISTS",
        kind: "rejection",
        reason: "Membership already exists",
      },
    });
  });

  it("stages an OpenMembershipRejected notification when the membership already exists", async () => {
    await handler.handle(command);
    await handler.handle(command);

    const rows = datasource.read<OutboxEnvelope<OpenMembershipRejected>>(OUTBOX_TABLE);
    const notification = rows.find((row) => row.entry.kind === "notification");

    expect(notification).toMatchObject({
      status: "pending",
      entry: {
        kind: "notification",
        type: "OpenMembershipRejected",
        payload: { name: "Jane Doe", email: "jane@example.com" },
        commandId: command.id,
        commandType: command.type,
        details: {
          kind: "rejection",
          code: "MEMBERSHIP_ALREADY_EXISTS",
          reason: "Membership already exists",
        },
      },
    });
  });

  it("returns a GatewayFailure when the event store is offline (fails at load, before any write)", async () => {
    eventStore.simulate("offline");
    const failure = (await handler.handle(command))._unsafeUnwrapErr();
    expect(failure).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryEventStore" });
  });

  it("returns a GatewayFailure when the outbox is offline (fails at the atomic write)", async () => {
    outbox.simulate("offline");
    const failure = (await handler.handle(command))._unsafeUnwrapErr();
    expect(failure).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryIntentOutbox" });
  });

  it("returns a GatewayFailure when the outbox is offline and the command is rejected", async () => {
    await handler.handle(command);
    outbox.simulate("offline");

    const failure = (await handler.handle(command))._unsafeUnwrapErr();
    expect(failure).toMatchObject({ code: "GATEWAY_FAILURE", gateway: "InMemoryIntentOutbox" });
  });

  it("persists neither the event nor the intent when the outbox side is offline (atomic rollback)", async () => {
    outbox.simulate("offline");
    await handler.handle(command);
    outbox.restore();

    const stored = (
      await eventStore.load([createStreamKey(ANCHOR_MEMBERSHIP, command.payload.membershipId)])
    )._unsafeUnwrap();
    expect(stored).toEqual([]);

    const pending = (await outbox.loadPending())._unsafeUnwrap();
    expect(pending).toEqual([]);
  });
});
