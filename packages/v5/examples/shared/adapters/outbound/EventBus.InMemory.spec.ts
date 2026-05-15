import type { ConsumeEvents } from "@adapters/outbound/capabilities/ConsumeEvents.ts";
import type { PublishEvents } from "@adapters/outbound/capabilities/PublishEvents.ts";
import type { RegisterEventSubscriber } from "@adapters/outbound/capabilities/RegisterEventSubscriber.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";
import { InMemoryEventBus } from "./EventBus.InMemory.ts";
import { randomUUID } from "node:crypto";

const eventType = "TestDomainEvent" as const;
const aggregateType = "Test" as const;

interface TestDomainEvent extends DomainEvent<typeof eventType | string, { name: string }> {}

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
  let bus: RegisterEventSubscriber & PublishEvents<DomainEvent>;
  let consumedEvents: DomainEvent[];

  beforeEach(() => {
    bus = new InMemoryEventBus();
    consumedEvents = [];
  });

  it("should subscribe and publish events", async () => {
    const aggregateId = randomUUID();
    const handler: ConsumeEvents<DomainEvent> = {
      consume: async (event) => {
        consumedEvents.push(event);
      },
    };
    await bus.subscribe(aggregateType, handler);
    await bus.publish([makeEvent(eventType, aggregateId)]);
    expect(consumedEvents).toHaveLength(1);
    expect(consumedEvents[0].aggregateId).toBe(aggregateId);
  });

  it("should publish events to multiple handlers", async () => {
    const aggregateId = randomUUID();
    const handler1: ConsumeEvents<DomainEvent> = {
      consume: async (event) => {
        consumedEvents.push(event);
      },
    };
    const handler2: ConsumeEvents<DomainEvent> = {
      consume: async (event) => {
        consumedEvents.push(event);
      },
    };
    await bus.subscribe(aggregateType, handler1);
    await bus.subscribe(aggregateType, handler2);
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
});
