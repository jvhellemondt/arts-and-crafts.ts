import type { LoadsDomainEvents } from "@adapters/outbound/capabilities/LoadsDomainEvents.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import { InMemoryEventStore } from "./EventStore.InMemory.ts";
import type { AppendsDomainEvents } from "@adapters/outbound/capabilities/AppendsDomainEvents.ts";
import { randomUUID } from "node:crypto";

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
  let eventStore: LoadsDomainEvents<Promise<TestDomainEvent[]>> &
    AppendsDomainEvents<TestDomainEvent>;

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
});