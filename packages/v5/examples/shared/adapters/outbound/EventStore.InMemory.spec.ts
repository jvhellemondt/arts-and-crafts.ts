import type { LoadsDomainEvents } from "@adapters/outbound/capabilities/LoadsDomainEvents.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import { InMemoryEventStore } from "./EventStore.InMemory.ts";
import type { AppendsDomainEvents } from "@adapters/outbound/capabilities/AppendsDomainEvents.ts";
import { randomUUID } from "node:crypto";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { SimulatesFaults } from "@adapters/outbound/capabilities/SimulatesFaults.ts";

interface TestDomainEvent extends DomainEvent<"TestDomainEvent", { name: string }> {}

const makeEvent = (aggregateType: string, aggregateId: string): TestDomainEvent => ({
  type: "TestDomainEvent",
  payload: { name: "Elon Musk" },
  kind: "domain",
  aggregateType,
  aggregateId,
  timestamp: Date.now(),
  metadata: {
    correlationId: randomUUID(),
    causationId: randomUUID(),
  },
  id: randomUUID(),
});

describe("in-memory event store", () => {
  const aggregateId = randomUUID();
  const streamName = "users";
  let eventStore: LoadsDomainEvents<TestDomainEvent, Promise<TestDomainEvent[] | GatewayFailure>> &
    AppendsDomainEvents<TestDomainEvent, Promise<void | GatewayFailure>> &
    SimulatesFaults;

  const fixture = [
    makeEvent(streamName, aggregateId),
    makeEvent(streamName, aggregateId),
    makeEvent(streamName, aggregateId),
  ];

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
  });

  it("should be defined", () => {
    expect(InMemoryEventStore).toBeDefined();
  });

  it.each([
    { streamName, expected: fixture },
    { streamName: "test", expected: [] },
  ])("should load domain events for '$streamName'", async ({ streamName, expected }) => {
    await eventStore.append(fixture);
    const events = await eventStore.load(streamName, aggregateId);
    expect(events).toEqual(expected);
  });

  it("should return empty array if no events were appended", async () => {
    const events = await eventStore.load(streamName, aggregateId);
    expect(events).toEqual([]);
  });

  it.each<{ events: TestDomainEvent[] }>([
    { events: [makeEvent(streamName, randomUUID())] },
    {
      events: [
        makeEvent(streamName, randomUUID()),
        makeEvent(streamName, randomUUID()),
        makeEvent(streamName, randomUUID()),
      ],
    },
  ])("should append $events.length domain event(s)", async ({ events }) => {
    await expect(eventStore.append(events)).resolves.not.toThrow();
  });

  it("should append events when events already exist in the store", async () => {
    await eventStore.append(fixture);
    await expect(eventStore.append([makeEvent(streamName, randomUUID())])).resolves.not.toThrow();
  });

  describe("should simulate offline fault", async () => {
    beforeEach(() => {
      eventStore.simulate("offline");
    });

    it("should expose isSimulating property as true", () => {
      expect(eventStore.isSimulating).toBe(true);
    });

    it("should return gateway failure when loading events", async () => {
      const response = await eventStore.load(streamName, aggregateId);
      expect(response).toEqual({
        kind: "GatewayFailure",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should return gateway failure when appending events", async () => {
      const response = await eventStore.append([makeEvent(streamName, randomUUID())]);
      expect(response).toEqual({
        kind: "GatewayFailure",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should restore the event store to online state", async () => {
      eventStore.restore();
      expect(eventStore.isSimulating).toBe(false);
      await eventStore.append(fixture);
      const events = await eventStore.load(streamName, aggregateId);
      expect(events).toEqual(fixture);
    });
  });
});
