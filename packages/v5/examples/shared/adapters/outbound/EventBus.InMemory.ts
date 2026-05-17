import type { ConsumeEvents } from "@adapters/outbound/capabilities/ConsumeEvents.ts";
import type { PublishEvents } from "@adapters/outbound/capabilities/PublishEvents.ts";
import type { RegisterEventSubscriber } from "@adapters/outbound/capabilities/RegisterEventSubscriber.ts";
import type { StoredEvent } from "@adapters/outbound/shapes/StoredEvent.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export interface SubscriberFailure<TEvent extends DomainEvent> {
  storedEvent: StoredEvent<TEvent>;
  handler: ConsumeEvents<TEvent>;
  cause: unknown;
}

export class InMemoryEventBus<TEvent extends DomainEvent = DomainEvent>
  implements RegisterEventSubscriber<TEvent>, PublishEvents<TEvent>
{
  private readonly handlers: Map<string, ConsumeEvents<TEvent>[]> = new Map();
  private readonly onSubscriberFailure: (failure: SubscriberFailure<TEvent>) => void;

  constructor(onSubscriberFailure: (failure: SubscriberFailure<TEvent>) => void = () => {}) {
    this.onSubscriberFailure = onSubscriberFailure;
  }

  subscribe<T extends TEvent>(aggregateType: T["aggregateType"], handler: ConsumeEvents<T>): void {
    const list = this.handlers.get(aggregateType) ?? [];
    list.push(handler as ConsumeEvents<TEvent>);
    this.handlers.set(aggregateType, list);
  }

  async publish(events: StoredEvent<TEvent>[]): Promise<void> {
    for (const storedEvent of events) {
      const handlers = this.handlers.get(storedEvent.stream) ?? [];
      const results = await Promise.allSettled(
        handlers.map((handler) => handler.consume(storedEvent)),
      );
      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          this.onSubscriberFailure({
            storedEvent,
            handler: handlers[idx],
            cause: result.reason,
          });
        }
      });
    }
  }
}
