import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { InMemoryIntentOutbox } from "@examples/shared/adapters/outbound/Outbox.InMemory.ts";
import { MembershipRepository } from "@examples/modules/membership/core/repository.ts";
import type { MembershipEventV1 } from "@examples/modules/membership/core/events/index.ts";
import type { NotifyUserToVerifyEmailV1 } from "@examples/modules/membership/core/intents/v1/NotifyUserToVerifyEmail.ts";
import { createOpenMembershipCommand, openMembershipCommandPayload } from "./command.ts";
import { OpenMembershipHandler } from "./handler.ts";
import { randomUUID } from "node:crypto";
import { v7 as uuidv7 } from "uuid";

const makeCommand = (membershipId: string = uuidv7()) =>
  createOpenMembershipCommand(
    openMembershipCommandPayload.parse({
      membershipId,
      name: "Jane Doe",
      email: "jane@example.com",
    }),
    { correlationId: randomUUID(), causationId: randomUUID() },
  );

describe("OpenMembershipHandler", () => {
  let eventStore: InMemoryEventStore<MembershipEventV1>;
  let outbox: InMemoryIntentOutbox<NotifyUserToVerifyEmailV1>;
  let repository: MembershipRepository;
  let handler: OpenMembershipHandler;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    outbox = new InMemoryIntentOutbox<NotifyUserToVerifyEmailV1>();
    repository = new MembershipRepository(eventStore);
    handler = new OpenMembershipHandler(repository, outbox);
  });

  it("returns void when the membership is successfully opened", async () => {
    const result = await handler.handle(makeCommand());
    expect(result).toEqual([]);
  });

  it("returns the rejection when the membership already exists", async () => {
    const membershipId = uuidv7();
    await handler.handle(makeCommand(membershipId));

    const result = await handler.handle(makeCommand(membershipId));

    expect(result).toMatchObject({ code: "MEMBERSHIP_ALREADY_EXISTS" });
  });

  it("returns a GatewayFailure when the event store is offline", async () => {
    eventStore.simulate("offline");
    const result = await handler.handle(makeCommand());
    expect(result).toMatchObject([{ kind: "GatewayFailure", gateway: "InMemoryEventStore" }]);
  });

  it("returns GatewayFailures when the outbox is offline", async () => {
    outbox.simulate("offline");
    const result = await handler.handle(makeCommand());
    expect(result).toMatchObject([{ kind: "GatewayFailure", gateway: "InMemoryIntentOutbox" }]);
  });
});
