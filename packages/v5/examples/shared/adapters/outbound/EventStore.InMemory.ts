import type { AppendsDomainEvents } from "@adapters/outbound/capabilities/AppendsDomainEvents.ts";
import type { LoadsDomainEvents } from "@adapters/outbound/capabilities/LoadsDomainEvents.ts";
import type { StoredEvent } from "@adapters/outbound/shapes/StoredEvent.ts";
import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export class InMemoryEventStore<TEvent extends DomainEvent>
  implements LoadsDomainEvents<Promise<TEvent[]>>, AppendsDomainEvents<TEvent>
{
  private readonly tableName: string = "event_store";

  constructor(private readonly datasource: Map<string, StoredEvent<TEvent>[]> = new Map()) {}

  private get rows(): StoredEvent<TEvent>[] {
    if (!this.datasource.has(this.tableName)) {
      this.datasource.set(this.tableName, []);
    }
    return this.datasource.get(this.tableName)!;
  }

  async load(streamName: string, aggregateId: string): Promise<TEvent[]> {
    const streamKey: StreamKey = `${streamName}#${aggregateId}`;
    return this.rows
      .filter((envelope) => envelope.streamKey === streamKey)
      .map((envelope) => envelope.event);
  }

  async append(domainEvents: TEvent[]): Promise<void> {
    for (const event of domainEvents) {
      const streamKey: StreamKey = `${event.aggregateType}#${event.aggregateId}`;
      const streamVersion = this.rows.filter((e) => e.streamKey === streamKey).length + 1;

      this.rows.push({
        streamKey,
        streamVersion,
        globalPosition: this.rows.length + 1,
        insertedAt: Date.now(),
        event,
      });
    }
  }
}
