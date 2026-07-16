import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
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
  let repository: OpenMembershipRepository;
  let handler: OpenMembershipHandler;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    outbox = new InMemoryOutbox<NotifyUserToVerifyEmailV1, never>();
    repository = new OpenMembershipRepository(eventStore);
    handler = new OpenMembershipHandler(repository, outbox);
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

  it("returns a GatewayFailure when the event store is offline", async () => {
    eventStore.simulate("offline");
    const failures = (await handler.handle(command))._unsafeUnwrapErr();
    expect(failures).toMatchObject([{ code: "GATEWAY_FAILURE", gateway: "InMemoryEventStore" }]);
  });

  it("returns GatewayFailures when the outbox is offline", async () => {
    outbox.simulate("offline");
    const failures = (await handler.handle(command))._unsafeUnwrapErr();
    expect(failures).toMatchObject([{ code: "GATEWAY_FAILURE", gateway: "InMemoryIntentOutbox" }]);
  });
});
