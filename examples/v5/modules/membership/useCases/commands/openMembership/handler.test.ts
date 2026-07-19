import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { InMemoryTransactionalWriter } from "@examples/shared/adapters/outbound/TransactionalWriter.InMemory.ts";
import { createStreamKey } from "@examples/shared/utils/createStreamKey.ts";
import { ANCHOR_MEMBERSHIP } from "@examples/modules/membership/core/anchors.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { createOpenMembershipCommand, openMembershipCommandPayload } from "./command.ts";
import { OpenMembershipHandler } from "./handler.ts";
import { randomUUID } from "node:crypto";
import { OpenMembershipRepository } from "./repository.ts";
import { v7 as uuidv7 } from "uuid";

const command = createOpenMembershipCommand(
  openMembershipCommandPayload.parse({
    membershipId: uuidv7(),
    name: "Jane Doe",
    email: "jane@example.com",
  }),
  { correlationId: randomUUID(), causationId: randomUUID() },
);

describe("OpenMembershipHandler", () => {
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let outbox: InMemoryOutbox<NotifyUserToVerifyEmailV1, never>;
  let writer: InMemoryTransactionalWriter<MembershipEventV1, NotifyUserToVerifyEmailV1>;
  let repository: OpenMembershipRepository;
  let handler: OpenMembershipHandler;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    outbox = new InMemoryOutbox<NotifyUserToVerifyEmailV1, never>();
    writer = new InMemoryTransactionalWriter(eventStore, outbox);
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

  it("returns a GatewayFailure when the event store is offline (fails at load, before any write)", async () => {
    eventStore.simulate("offline");
    const failures = (await handler.handle(command))._unsafeUnwrapErr();
    expect(failures).toMatchObject([{ code: "GATEWAY_FAILURE", gateway: "InMemoryEventStore" }]);
  });

  it("returns a GatewayFailure when the outbox is offline (fails at the atomic write)", async () => {
    outbox.simulate("offline");
    const failures = (await handler.handle(command))._unsafeUnwrapErr();
    expect(failures).toMatchObject([
      { code: "GATEWAY_FAILURE", gateway: "InMemoryTransactionalWriter" },
    ]);
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
