import type { ConsumeEvents } from "@adapters/outbound/capabilities/ConsumeEvents.ts";
import type { PublishEvents } from "@adapters/outbound/capabilities/PublishEvents.ts";
import type { RegisterEventSubscriber } from "@adapters/outbound/capabilities/RegisterEventSubscriber.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export class InMemoryEventBus implements RegisterEventSubscriber, PublishEvents<DomainEvent> {
  private handlers: Map<string, ConsumeEvents<DomainEvent>[]> = new Map();

  async subscribe(stream: string, handler: ConsumeEvents<DomainEvent>): Promise<void> {
    if (!this.handlers.has(stream)) {
      this.handlers.set(stream, []);
    }
    this.handlers.get(stream)!.push(handler);
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      const handlers = this.handlers.get(event.aggregateType);
      if (handlers) {
        for (const handler of handlers) {
          await handler.consume(event);
        }
      }
    }
  }
}
