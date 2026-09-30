import type {
  AppendToEventStore,
  LoadDomainEvents,
  LoadEventsFrom,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type {
  DynamicConsistencyResult,
  GatewayFailure,
  StoredEvent,
  StreamKey,
} from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";
import type { ResultAsync } from "neverthrow";
import { randomUUID } from "node:crypto";
import { type AppendFailure, InMemoryEventStore } from "./EventStore.InMemory.ts";

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
  let eventStore: LoadDomainEvents<
    TestDomainEvent,
    ResultAsync<DynamicConsistencyResult<TestDomainEvent>, GatewayFailure>
  > &
    LoadEventsFrom<TestDomainEvent, ResultAsync<StoredEvent<TestDomainEvent>[], GatewayFailure>> &
    AppendToEventStore<TestDomainEvent, ResultAsync<void, AppendFailure>> &
    SimulateFaults;

  const fixture = [
    makeEvent(streamKeys[0]),
    makeEvent([streamKeys[0][0]]),
    makeEvent(streamKeys[0].slice(0, 2)),
    makeEvent(streamKeys[0].slice(1, 3)),
    makeEvent([...streamKeys[1]]),
  ];

  const append = (events: TestDomainEvent[], versions: Record<StreamKey, number> = {}) =>
    eventStore.append(events, versions);

  const load = async (concerns: readonly StreamKey[]) =>
    (await eventStore.load(concerns)).match(
      (result) => result,
      (failure) => {
        throw new Error(`Expected Ok, got Err: ${JSON.stringify(failure)}`);
      },
    );

  const loadFrom = async (globalPosition: number, limit?: number) =>
    (await eventStore.loadFrom(globalPosition, limit)).match(
      (rows) => rows,
      (failure) => {
        throw new Error(`Expected Ok, got Err: ${JSON.stringify(failure)}`);
      },
    );

  const expectErr = async <T, E>(result: ResultAsync<T, E>) =>
    (await result).match(
      (value) => {
        throw new Error(`Expected Err, got Ok: ${JSON.stringify(value)}`);
      },
      (failure) => failure,
    );

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
    await Promise.all(fixture.map((event) => append([event])));
    const { events } = await load(concerns);
    expect(events.map(({ id }) => id)).toEqual(expected.map(({ id }) => id));
  });

  it("should return empty array if no events were appended", async () => {
    const { events } = await load(streamKeys[0]);
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
    const results = await Promise.all(events.map((event) => append([event])));
    expect(results.every((result) => result.isOk())).toBe(true);
  });

  it("should append events when events already exist in the store", async () => {
    await append(fixture);
    const event = makeEvent(streamKeys[0]);
    expect((await append([event])).isOk()).toBe(true);
  });

  describe("versions", () => {
    it("reports 0 for every queried concern nothing has been appended to", async () => {
      const { versions } = await load(streamKeys[0]);
      expect(versions).toEqual({
        [streamKeys[0][0]]: 0,
        [streamKeys[0][1]]: 0,
        [streamKeys[0][2]]: 0,
      });
    });

    it("counts the events carrying each queried concern, one version per concern", async () => {
      await append(fixture);

      const { versions } = await load(streamKeys[0]);

      expect(versions).toEqual({
        [streamKeys[0][0]]: 3,
        [streamKeys[0][1]]: 3,
        [streamKeys[0][2]]: 2,
      });
    });

    it("appends when every guarded concern still stands at the version that was read", async () => {
      await append(fixture);
      const { versions } = await load(streamKeys[0]);

      const result = await eventStore.append([makeEvent([streamKeys[0][0]])], versions);

      expect(result.isOk()).toBe(true);
    });

    it("refuses when a guarded concern moved on since it was read", async () => {
      await append(fixture);
      const { versions } = await load(streamKeys[0]);
      await append([makeEvent([streamKeys[0][0]])]);

      const failure = await expectErr(eventStore.append([makeEvent([streamKeys[0][0]])], versions));

      expect(failure).toEqual({
        kind: "failure",
        code: "CONCURRENCY_CONFLICT",
        gateway: "InMemoryEventStore",
        reason: `concern(s) moved on since they were read: ${streamKeys[0][0]}`,
      });
    });

    it("guards concerns that were only read from, not written to", async () => {
      await append(fixture);
      const { versions } = await load(streamKeys[0]);
      await append([makeEvent([streamKeys[0][2]])]);

      const failure = await expectErr(eventStore.append([makeEvent([streamKeys[0][0]])], versions));

      expect(failure).toMatchObject({ code: "CONCURRENCY_CONFLICT" });
    });

    it("writes nothing when the append is refused", async () => {
      await append(fixture);
      const { versions } = await load(streamKeys[0]);
      await append([makeEvent([streamKeys[0][0]])]);
      const before = (await loadFrom(1)).length;

      await eventStore.append([makeEvent([streamKeys[0][0]])], versions);

      expect(await loadFrom(1)).toHaveLength(before);
    });
  });

  describe("loadFrom", () => {
    it("returns all stored events from globalPosition 1", async () => {
      await append(fixture);
      const result = await loadFrom(1);
      expect(result).toHaveLength(fixture.length);
      expect(result.map((row) => row.globalPosition)).toEqual([1, 2, 3, 4, 5]);
    });

    it("filters out rows before the given globalPosition", async () => {
      await append(fixture);
      const result = await loadFrom(2);
      expect(result.map((row) => row.globalPosition)).toEqual([2, 3, 4, 5]);
    });

    it("honours the optional limit", async () => {
      await append(fixture);
      const result = await loadFrom(1, 2);
      expect(result.map((row) => row.globalPosition)).toEqual([1, 2]);
    });

    it("returns an empty array when nothing has been appended", async () => {
      const result = await loadFrom(1);
      expect(result).toEqual([]);
    });
  });

  describe("should simulate offline fault", () => {
    beforeEach(() => {
      eventStore.simulate("offline");
    });

    it("should expose isSimulating property as true", () => {
      expect(eventStore.isSimulating).toBe(true);
    });

    it("should return gateway failure when loading events", async () => {
      const response = await expectErr(eventStore.load(streamKeys[0]));
      expect(response).toEqual({
        kind: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should return gateway failure when appending events", async () => {
      const event = makeEvent(streamKeys[0]);
      const response = await expectErr(append([event]));
      expect(response).toEqual({
        kind: "failure",
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      });
    });

    it("should return gateway failure from loadFrom", async () => {
      const response = await expectErr(eventStore.loadFrom(0));
      expect(response).toMatchObject({
        code: "GATEWAY_FAILURE",
        gateway: "InMemoryEventStore",
      });
    });

    it("should restore the event store to online state", async () => {
      eventStore.restore();
      expect(eventStore.isSimulating).toBe(false);
      await Promise.all(fixture.map((event) => append([event])));
      const { events } = await load([streamKeys[0][0]]);
      expect(events.map(({ id }) => id)).toEqual(fixture.slice(0, 3).map(({ id }) => id));
    });
  });
});
