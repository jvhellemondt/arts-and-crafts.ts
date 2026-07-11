import type {
  AppendToEventStore,
  LoadDomainEvents,
  LoadEventsFrom,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type {
  GatewayFailure,
  StoredEvent,
  StreamKey,
} from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";
import { randomUUID } from "node:crypto";
import { InMemoryEventStore } from "./EventStore.InMemory.ts";

interface TestDomainEvent extends DomainEvent<"TestDomainEvent", { name: string }> {}

const makeEvent = (concerns: readonly StreamKey[]): TestDomainEvent => ({
  type: "TestDomainEvent",
  payload: { name: "Elon Musk" },
  concerns,
  kind: "domain",
  commandId: randomUUID(),
  commandType: "TestDomainEventCommand",
  timestamp: Date.now(),
  metadata: {
    correlationId: randomUUID(),
    causationId: randomUUID(),
  },
  id: randomUUID(),
});

describe("in-memory event store", () => {
  const seatBoundedContext = "seat";
  const userBoundedContext = "user";
  const showBoundedContext = "show";
  const streamKeys: StreamKey[][] = [
    [
      `${seatBoundedContext}#3`,
      `${userBoundedContext}#${randomUUID()}`,
      `${showBoundedContext}#${randomUUID()}`,
    ],
    [
      `${seatBoundedContext}#4`,
      `${userBoundedContext}#${randomUUID()}`,
      `${showBoundedContext}#${randomUUID()}`,
    ],
  ];
  let eventStore: LoadDomainEvents<TestDomainEvent, Promise<TestDomainEvent[] | GatewayFailure>> &
    LoadEventsFrom<TestDomainEvent> &
    AppendToEventStore<TestDomainEvent, Promise<void | GatewayFailure>> &
    SimulateFaults;

  const fixture = [
    makeEvent(streamKeys[0]),
    makeEvent([streamKeys[0][0]]),
    makeEvent(streamKeys[0].slice(0, 2)),
    makeEvent(streamKeys[0].slice(1, 3)),
    makeEvent([...streamKeys[1]]),
  ];

  beforeEach(() => {
    eventStore = new InMemoryEventStore();
  });

  it("should be defined", () => {
    expect(InMemoryEventStore).toBeDefined();
  });

  it.each<{ concerns: StreamKey[]; expected: typeof fixture }>([
    { concerns: [streamKeys[0][0]], expected: fixture.slice(0, 3) },
    { concerns: [streamKeys[0][1]], expected: [fixture[0], fixture[2], fixture[3]] },
    { concerns: [streamKeys[1][1]], expected: [fixture[4]] },
    { concerns: ["test#67"], expected: [] },
    {
      concerns: [streamKeys[0][0], streamKeys[0][1]],
      expected: [fixture[0], fixture[1], fixture[2], fixture[3]],
    },
    {
      concerns: [streamKeys[0][0], streamKeys[1][1]],
      expected: [fixture[0], fixture[1], fixture[2], fixture[4]],
    },
  ])("should load domain events by given concerns", async ({ concerns, expected }) => {
    await Promise.all(fixture.map((event) => eventStore.append([event])));
    const events = await eventStore.load(concerns);
    if (!Array.isArray(events)) throw new Error("expected array");
    expect(events.map(({ id }) => id)).toEqual(expected.map(({ id }) => id));
  });

  it("should return empty array if no events were appended", async () => {
    const events = await eventStore.load(streamKeys[0]);
    expect(events).toEqual([]);
  });

  it.each<{ events: TestDomainEvent[] }>([
    { events: [makeEvent(streamKeys[0])] },
    {
      events: [
        makeEvent([streamKeys[0][0]]),
        makeEvent([streamKeys[0][1]]),
        makeEvent([streamKeys[1][2]]),
        makeEvent(streamKeys[1]),
      ],
    },
  ])("should append $events.length domain event(s)", async ({ events }) => {
    const promise = Promise.all(events.map((event) => eventStore.append([event])));
    await expect(promise).resolves.not.toThrow();
  });

  it("should append events when events already exist in the store", async () => {
    await eventStore.append(fixture);
    const event = makeEvent(streamKeys[0]);
    await expect(eventStore.append([event])).resolves.not.toThrow();
  });

  describe("loadFrom", () => {
    it("returns all stored events from globalPosition 1", async () => {
      await eventStore.append(fixture);
      const result = (await eventStore.loadFrom(1)) as StoredEvent<TestDomainEvent>[];
      expect(result).toHaveLength(fixture.length);
      expect(result.map((row) => row.globalPosition)).toEqual([1, 2, 3, 4, 5]);
    });

    it("filters out rows before the given globalPosition", async () => {
      await eventStore.append(fixture);
      const result = (await eventStore.loadFrom(2)) as StoredEvent<TestDomainEvent>[];
      expect(result.map((row) => row.globalPosition)).toEqual([2, 3, 4, 5]);
    });

    it("honours the optional limit", async () => {
      await eventStore.append(fixture);
      const result = (await eventStore.loadFrom(1, 2)) as StoredEvent<TestDomainEvent>[];
      expect(result.map((row) => row.globalPosition)).toEqual([1, 2]);
    });

    it("returns an empty array when nothing has been appended", async () => {
      const result = await eventStore.loadFrom(1);
      expect(result).toEqual([]);
    });
  });

  describe("should simulate offline fault", async () => {
    beforeEach(() => {
      eventStore.simulate("offline");
    });

    it("should expose isSimulating property as true", () => {
      expect(eventStore.isSimulating).toBe(true);
    });

    it("should return gateway failure when loading events", async () => {
      const response = await eventStore.load(streamKeys[0]);
      expect(response).toEqual({
        kind: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should return gateway failure when appending events", async () => {
      const event = makeEvent(streamKeys[0]);
      const response = await eventStore.append([event]);
      expect(response).toEqual({
        kind: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should return gateway failure from loadFrom", async () => {
      const response = await eventStore.loadFrom(0);
      expect(response).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryEventStore",
      });
    });

    it("should restore the event store to online state", async () => {
      eventStore.restore();
      expect(eventStore.isSimulating).toBe(false);
      await Promise.all(fixture.map((event) => eventStore.append([event])));
      const events = await eventStore.load([streamKeys[0][0]]);
      if (!Array.isArray(events)) throw new Error("expected array");
      expect(events.map(({ id }) => id)).toEqual(fixture.slice(0, 3).map(({ id }) => id));
    });
  });
});
