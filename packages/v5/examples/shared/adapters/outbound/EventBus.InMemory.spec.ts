import type { ConsumeEvents } from "@adapters/outbound/capabilities/ConsumeEvents.ts";
import type { PublishEvents } from "@adapters/outbound/capabilities/PublishEvents.ts";
import type { RegisterEventSubscriber } from "@adapters/outbound/capabilities/RegisterEventSubscriber.ts";
import type { StoredEvent } from "@adapters/outbound/shapes/StoredEvent.ts";
import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import { InMemoryEventBus, type SubscriberFailure } from "./EventBus.InMemory.ts";
import { randomUUID } from "node:crypto";

const aggregateId = randomUUID();
const eventType = "TestDomainEvent" as const;
const eventType2 = "TestDomainEvent2" as const;
const aggregateType = "Test" as const;
const aggregateType2 = "Test2" as const;

interface TestDomainEvent extends DomainEvent<typeof eventType | string, { name: string }> {
  aggregateType: typeof aggregateType;
}

interface TestDomainEvent2 extends DomainEvent<typeof eventType2 | string, { name: string }> {
  aggregateType: typeof aggregateType2;
}

const makeEvent = (type: typeof eventType | string, aggregateId: string): TestDomainEvent => ({
  type,
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

const makeEvent2 = (type: typeof eventType2 | string, aggregateId: string): TestDomainEvent2 => ({
  type,
  payload: { name: "Elon Musk" },
  kind: "domain",
  aggregateType: aggregateType2,
  aggregateId,
  timestamp: Date.now(),
  metadata: {
    correlationId: randomUUID(),
    causationId: randomUUID(),
  },
  id: randomUUID(),
});

const wrap = <T extends TestDomainEvent | TestDomainEvent2>(
  event: T,
  overrides: Partial<StoredEvent<T>> = {},
): StoredEvent<T> => ({
  stream: event.aggregateType,
  streamKey: `${event.aggregateType}#${event.aggregateId}` as StreamKey,
  streamVersion: 1,
  globalPosition: 1,
  insertedAt: Date.now(),
  event,
  ...overrides,
});

describe("InMemoryEventBus", () => {
  let bus: RegisterEventSubscriber<TestDomainEvent | TestDomainEvent2> &
    PublishEvents<TestDomainEvent | TestDomainEvent2>;
  let consumedEvents: Array<TestDomainEvent | TestDomainEvent2>;

  beforeEach(() => {
    bus = new InMemoryEventBus<TestDomainEvent | TestDomainEvent2>();
    consumedEvents = [];
  });

  it.each([makeEvent(eventType, aggregateId), makeEvent2(eventType, aggregateId)])(
    "should subscribe and publish events $aggregateType",
    async (event) => {
      const handler: ConsumeEvents<TestDomainEvent | TestDomainEvent2> = {
        consume: async (stored) => {
          consumedEvents.push(stored.event);
        },
      };
      bus.subscribe(event.aggregateType, handler);
      await bus.publish([wrap(event)]);
      expect(consumedEvents).toHaveLength(1);
      expect(consumedEvents[0].aggregateId).toBe(event.aggregateId);
    },
  );

  it("should deliver stream coordinates on the wrapped event", async () => {
    const aggregateId = randomUUID();
    const event = makeEvent(eventType, aggregateId);
    const received: StoredEvent<TestDomainEvent>[] = [];
    const sink = new InMemoryEventBus<TestDomainEvent>();
    sink.subscribe(aggregateType, {
      consume: async (stored) => {
        received.push(stored);
      },
    });

    await sink.publish([wrap(event, { streamVersion: 7, globalPosition: 42 })]);

    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({
      streamVersion: 7,
      globalPosition: 42,
      stream: aggregateType,
      streamKey: `${aggregateType}#${aggregateId}`,
    });
  });

  it("should publish events to multiple handlers", async () => {
    const aggregateId = randomUUID();
    const handler1: ConsumeEvents<TestDomainEvent | TestDomainEvent2> = {
      consume: async (stored) => {
        consumedEvents.push(stored.event);
      },
    };
    const handler2: ConsumeEvents<TestDomainEvent | TestDomainEvent2> = {
      consume: async (stored) => {
        consumedEvents.push(stored.event);
      },
    };
    bus.subscribe(aggregateType, handler1);
    bus.subscribe(aggregateType, handler2);
    await bus.publish([wrap(makeEvent(eventType, aggregateId))]);
    expect(consumedEvents).toHaveLength(2);
    expect(consumedEvents[0].aggregateId).toBe(aggregateId);
    expect(consumedEvents[1].aggregateId).toBe(aggregateId);
  });

  it("should not consume if no handlers are registered", async () => {
    const aggregateId = randomUUID();
    await bus.publish([wrap(makeEvent(eventType, aggregateId))]);
    expect(consumedEvents).toHaveLength(0);
  });

  it("should isolate a throwing handler from other handlers on the same event", async () => {
    const aggregateId = randomUUID();
    const failing: ConsumeEvents<TestDomainEvent> = {
      consume: async () => {
        throw new Error("boom");
      },
    };
    const succeeding: ConsumeEvents<TestDomainEvent> = {
      consume: async (stored) => {
        consumedEvents.push(stored.event);
      },
    };
    const failures: SubscriberFailure<TestDomainEvent>[] = [];
    const sink = new InMemoryEventBus<TestDomainEvent>((failure) => {
      failures.push(failure);
    });
    sink.subscribe(aggregateType, failing);
    sink.subscribe(aggregateType, succeeding);

    const event = makeEvent(eventType, aggregateId);
    const stored = wrap(event);
    await expect(sink.publish([stored])).resolves.toBeUndefined();

    expect(consumedEvents).toEqual([event]);
    expect(failures).toHaveLength(1);
    expect(failures[0].storedEvent).toBe(stored);
    expect(failures[0].handler).toBe(failing);
    expect((failures[0].cause as Error).message).toBe("boom");
  });

  it("should swallow handler errors with the default failure sink", async () => {
    const aggregateId = randomUUID();
    const failing: ConsumeEvents<TestDomainEvent> = {
      consume: async () => {
        throw new Error("boom");
      },
    };
    bus.subscribe(aggregateType, failing);
    await expect(bus.publish([wrap(makeEvent(eventType, aggregateId))])).resolves.toBeUndefined();
  });

  it("should continue publishing the rest of the batch after a handler rejection", async () => {
    const first = makeEvent(eventType, randomUUID());
    const second = makeEvent(eventType, randomUUID());
    const firstStored = wrap(first);
    const secondStored = wrap(second);
    const seen: TestDomainEvent[] = [];
    const failures: SubscriberFailure<TestDomainEvent>[] = [];
    const sink = new InMemoryEventBus<TestDomainEvent>((failure) => {
      failures.push(failure);
    });
    sink.subscribe(aggregateType, {
      consume: async (stored) => {
        seen.push(stored.event);
        if (stored.event === first) {
          throw new Error("first failed");
        }
      },
    });

    await sink.publish([firstStored, secondStored]);

    expect(seen).toEqual([first, second]);
    expect(failures).toHaveLength(1);
    expect(failures[0].storedEvent).toBe(firstStored);
  });
});
