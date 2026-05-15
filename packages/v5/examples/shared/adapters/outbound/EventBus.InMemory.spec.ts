import type { ConsumeEvents } from "@adapters/outbound/capabilities/ConsumeEvents.ts";
import type { PublishEvents } from "@adapters/outbound/capabilities/PublishEvents.ts";
import type { RegisterEventSubscriber } from "@adapters/outbound/capabilities/RegisterEventSubscriber.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import { InMemoryEventBus, type SubscriberFailure } from "./EventBus.InMemory.ts";
import { randomUUID } from "node:crypto";

const eventType = "TestDomainEvent" as const;
const aggregateType = "Test" as const;

interface TestDomainEvent
  extends DomainEvent<typeof eventType | string, { name: string }> {
  aggregateType: typeof aggregateType;
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

describe("InMemoryEventBus", () => {
  let bus: RegisterEventSubscriber<TestDomainEvent> & PublishEvents<TestDomainEvent>;
  let consumedEvents: TestDomainEvent[];

  beforeEach(() => {
    bus = new InMemoryEventBus<TestDomainEvent>();
    consumedEvents = [];
  });

  it("should subscribe and publish events", async () => {
    const aggregateId = randomUUID();
    const handler: ConsumeEvents<TestDomainEvent> = {
      consume: async (event) => {
        consumedEvents.push(event);
      },
    };
    bus.subscribe(aggregateType, handler);
    await bus.publish([makeEvent(eventType, aggregateId)]);
    expect(consumedEvents).toHaveLength(1);
    expect(consumedEvents[0].aggregateId).toBe(aggregateId);
  });

  it("should publish events to multiple handlers", async () => {
    const aggregateId = randomUUID();
    const handler1: ConsumeEvents<TestDomainEvent> = {
      consume: async (event) => {
        consumedEvents.push(event);
      },
    };
    const handler2: ConsumeEvents<TestDomainEvent> = {
      consume: async (event) => {
        consumedEvents.push(event);
      },
    };
    bus.subscribe(aggregateType, handler1);
    bus.subscribe(aggregateType, handler2);
    await bus.publish([makeEvent(eventType, aggregateId)]);
    expect(consumedEvents).toHaveLength(2);
    expect(consumedEvents[0].aggregateId).toBe(aggregateId);
    expect(consumedEvents[1].aggregateId).toBe(aggregateId);
  });

  it("should not consume if no handlers are registered", async () => {
    const aggregateId = randomUUID();
    await bus.publish([makeEvent(eventType, aggregateId)]);
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
      consume: async (event) => {
        consumedEvents.push(event);
      },
    };
    const failures: SubscriberFailure<TestDomainEvent>[] = [];
    const sink = new InMemoryEventBus<TestDomainEvent>((failure) => {
      failures.push(failure);
    });
    sink.subscribe(aggregateType, failing);
    sink.subscribe(aggregateType, succeeding);

    const event = makeEvent(eventType, aggregateId);
    await expect(sink.publish([event])).resolves.toBeUndefined();

    expect(consumedEvents).toEqual([event]);
    expect(failures).toHaveLength(1);
    expect(failures[0].event).toBe(event);
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
    await expect(bus.publish([makeEvent(eventType, aggregateId)])).resolves.toBeUndefined();
  });

  it("should continue publishing the rest of the batch after a handler rejection", async () => {
    const first = makeEvent(eventType, randomUUID());
    const second = makeEvent(eventType, randomUUID());
    const seen: TestDomainEvent[] = [];
    const failures: SubscriberFailure<TestDomainEvent>[] = [];
    const sink = new InMemoryEventBus<TestDomainEvent>((failure) => {
      failures.push(failure);
    });
    sink.subscribe(aggregateType, {
      consume: async (event) => {
        seen.push(event);
        if (event === first) {
          throw new Error("first failed");
        }
      },
    });

    await sink.publish([first, second]);

    expect(seen).toEqual([first, second]);
    expect(failures).toHaveLength(1);
    expect(failures[0].event).toBe(first);
  });
});
