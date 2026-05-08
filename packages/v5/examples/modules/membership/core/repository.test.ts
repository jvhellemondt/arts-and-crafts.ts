import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import type { LoadDomainEvents } from "@adapters/outbound/capabilities/LoadDomainEvents.ts";
import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { randomUUID } from "node:crypto";
import type { MembershipEventV1 } from "./events/index.ts";
import type { MembershipOpenedV1 } from "./events/v1/MembershipOpenedV1.ts";
import { MembershipRepository } from "./repository.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";

const makeEvent = (aggregateId: string): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  aggregateType: "Membership",
  aggregateId,
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: {
    correlationId: randomUUID(),
    causationId: randomUUID(),
  },
  payload: {
    aggregateId,
    name: "Jane Doe",
    email: "jane@example.com",
  },
});

describe("MembershipRepository", () => {
  let eventStore: LoadDomainEvents<
    MembershipEventV1,
    Promise<MembershipEventV1[] | GatewayFailure>
  > &
    AppendToEventStream<MembershipEventV1, Promise<void | GatewayFailure>>;
  let repository: MembershipRepository;

  beforeEach(() => {
    eventStore = new InMemoryEventStore<MembershipEventV1>();
    repository = new MembershipRepository(eventStore);
  });

  describe("store", () => {
    it("appends the event to the membership stream", async () => {
      const aggregateId = randomUUID();
      const event = makeEvent(aggregateId);

      await repository.store([event]);

      const stored = await eventStore.load("membership", aggregateId);
      expect(stored).toEqual([event]);
    });

    it("appends multiple events to their respective aggregate streams", async () => {
      const aggregateId1 = randomUUID();
      const aggregateId2 = randomUUID();

      await repository.store([makeEvent(aggregateId1), makeEvent(aggregateId2)]);

      expect(await eventStore.load("membership", aggregateId1)).toHaveLength(1);
      expect(await eventStore.load("membership", aggregateId2)).toHaveLength(1);
    });

    it("does not append to any other stream", async () => {
      const aggregateId = randomUUID();

      await repository.store([makeEvent(aggregateId)]);

      const stored = await eventStore.load("other", aggregateId);
      expect(stored).toEqual([]);
    });
  });

  describe("load", () => {
    it("returns an empty array when no events exist for the aggregate", async () => {
      const events = await repository.load(randomUUID());
      expect(events).toEqual([]);
    });

    it("returns events previously stored for the aggregate", async () => {
      const aggregateId = randomUUID();
      const event = makeEvent(aggregateId);
      await repository.store([event]);

      const events = await repository.load(aggregateId);
      expect(events).toEqual([event]);
    });

    it("does not return events belonging to a different aggregate", async () => {
      const aggregateId = randomUUID();
      await repository.store([makeEvent(aggregateId)]);

      const events = await repository.load(randomUUID());
      expect(events).toEqual([]);
    });
  });
});
