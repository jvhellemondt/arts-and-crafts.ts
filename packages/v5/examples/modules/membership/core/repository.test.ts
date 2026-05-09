import { InMemoryEventStore } from "@examples/shared/adapters/outbound/EventStore.InMemory.ts";
import { randomUUID } from "node:crypto";
import type { MembershipEventV1 } from "./events/index.ts";
import type { MembershipOpenedV1 } from "./events/v1/MembershipOpenedV1.ts";
import { MembershipRepository } from "./repository.ts";

const makeEvent = (aggregateId: string): MembershipOpenedV1 => ({
  type: "MembershipOpened.v1",
  kind: "domain",
  aggregateType: "Membership",
  aggregateId,
  timestamp: Date.now(),
  id: randomUUID(),
  metadata: { correlationId: randomUUID(), causationId: randomUUID() },
  payload: { aggregateId, name: "Jane Doe", email: "jane@example.com" },
});

describe("MembershipRepository", () => {
  let eventStore: InMemoryEventStore<MembershipEventV1>;
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

      const stored = await eventStore.load("Membership", aggregateId);
      expect(stored).toEqual([event]);
    });

    it("appends multiple events to their respective aggregate streams", async () => {
      const aggregateId1 = randomUUID();
      const aggregateId2 = randomUUID();

      await repository.store([makeEvent(aggregateId1), makeEvent(aggregateId2)]);

      expect(await eventStore.load("Membership", aggregateId1)).toHaveLength(1);
      expect(await eventStore.load("Membership", aggregateId2)).toHaveLength(1);
    });

    it("does not append to any other stream", async () => {
      const aggregateId = randomUUID();

      await repository.store([makeEvent(aggregateId)]);

      expect(await eventStore.load("other", aggregateId)).toEqual([]);
    });
  });

  describe("load", () => {
    it("returns initial state when no events exist for the aggregate", async () => {
      const aggregateId = randomUUID();

      const state = await repository.load(aggregateId);

      expect(state).toEqual({ status: "initial", id: aggregateId });
    });

    it("returns the evolved state after storing events", async () => {
      const aggregateId = randomUUID();
      await repository.store([makeEvent(aggregateId)]);

      const state = await repository.load(aggregateId);

      expect(state).toMatchObject({
        status: "open",
        id: aggregateId,
        name: "Jane Doe",
        email: "jane@example.com",
      });
    });

    it("returns initial state for a different aggregate", async () => {
      const aggregateId = randomUUID();
      await repository.store([makeEvent(aggregateId)]);

      const otherId = randomUUID();
      const state = await repository.load(otherId);

      expect(state).toEqual({ status: "initial", id: otherId });
    });

    it("returns a GatewayFailure when the event store is offline", async () => {
      eventStore.simulate("offline");

      const state = await repository.load(randomUUID());

      expect(state).toMatchObject({ kind: "GatewayFailure" });
    });
  });
});
