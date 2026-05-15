import type { LoadDomainEvents } from "@adapters/outbound/capabilities/LoadDomainEvents.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import { InMemoryEventStore } from "./EventStore.InMemory.ts";
import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import { randomUUID } from "node:crypto";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { SimulateFaults } from "@adapters/outbound/capabilities/SimulateFaults.ts";
import type { EventTail } from "@adapters/outbound/capabilities/EventTail.ts";
import type { PublishEvents } from "@adapters/outbound/capabilities/PublishEvents.ts";

interface TestDomainEvent extends DomainEvent<"TestDomainEvent", { name: string }> {}

const publishEvents: TestDomainEvent[] = [];

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
  let eventStore: LoadDomainEvents<TestDomainEvent, Promise<TestDomainEvent[] | GatewayFailure>> &
    AppendToEventStream<TestDomainEvent, Promise<void | GatewayFailure>> &
    EventTail<TestDomainEvent> &
    SimulateFaults;

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
    { _streamName: streamName, expected: fixture },
    { _streamName: "test", expected: [] },
  ])("should load domain events for '$streamName'", async ({ _streamName, expected }) => {
    await Promise.all(fixture.map((event) => eventStore.append([event])));
    const events = await eventStore.load(_streamName, aggregateId);
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
    const promise = Promise.all(events.map((event) => eventStore.append([event])));
    await expect(promise).resolves.not.toThrow();
  });

  it("should append events when events already exist in the store", async () => {
    await eventStore.append(fixture);
    const event = makeEvent(streamName, randomUUID());
    await expect(eventStore.append([event])).resolves.not.toThrow();
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
        type: "failure",
        kind: "GatewayFailure",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should return gateway failure when appending events", async () => {
      const event = makeEvent(streamName, randomUUID());
      const response = await eventStore.append([event]);
      expect(response).toEqual({
        type: "failure",
        kind: "GatewayFailure",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should restore the event store to online state", async () => {
      eventStore.restore();
      expect(eventStore.isSimulating).toBe(false);
      await Promise.all(fixture.map((event) => eventStore.append([event])));
      const events = await eventStore.load(streamName, aggregateId);
      expect(events).toEqual(fixture);
    });
  });

  describe("with event publisher", async () => {
    it("should publish events", async () => {
      const publisher: PublishEvents<TestDomainEvent, Promise<void>> = {
        publish: async (events) => {
          publishEvents.push(...events);
        },
      };
      eventStore.withEventTail(publisher);
      await eventStore.append(fixture);
      expect(publishEvents).toEqual(fixture);
    });
  });
});
