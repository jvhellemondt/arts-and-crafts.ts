import type { AppendToEventStore } from "@adapters/outbound/capabilities/AppendToEventStore.ts";
import type { LoadDomainEvents } from "@adapters/outbound/capabilities/LoadDomainEvents.ts";
import type { LoadEventStreamFrom } from "@adapters/outbound/capabilities/LoadEventStreamFrom.ts";
import type { LoadEventsFrom } from "@adapters/outbound/capabilities/LoadEventsFrom.ts";
import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@adapters/outbound/capabilities/SimulateFaults.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { StoredEvent } from "@adapters/outbound/shapes/StoredEvent.ts";
import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export class InMemoryEventStore<TEvent extends DomainEvent>
  implements
    LoadDomainEvents<TEvent, Promise<TEvent[] | GatewayFailure>>,
    LoadEventsFrom<TEvent>,
    LoadEventStreamFrom<TEvent>,
    AppendToEventStore<TEvent, Promise<void | GatewayFailure>>,
    SimulateFaults
{
  private readonly tableName: string = "event_store";
  private simulation?: FaultSimulationMode;

  constructor(private readonly datasource: Map<string, StoredEvent<TEvent>[]> = new Map()) {}

  get isSimulating(): boolean {
    return this.simulation !== undefined;
  }

  get activeFault(): FaultSimulationMode | undefined {
    return this.simulation;
  }

  simulate(mode: "offline"): void {
    this.simulation = mode;
  }

  restore(): void {
    this.simulation = undefined;
  }

  private get rows(): StoredEvent<TEvent>[] {
    if (!this.datasource.has(this.tableName)) {
      this.datasource.set(this.tableName, []);
    }
    return this.datasource.get(this.tableName)!;
  }

  private offlineFailure(): GatewayFailure {
    return {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryEventStore",
      reason: "The Eventstore has been set to offline mode",
    };
  }

  async load(streamName: string, aggregateId: string): Promise<TEvent[] | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    const streamKey: StreamKey = `${streamName}#${aggregateId}`;
    return this.rows
      .filter((envelope) => envelope.streamKey === streamKey)
      .map((envelope) => envelope.event);
  }

  async loadFrom(
    globalPosition: number,
    limit?: number,
  ): Promise<StoredEvent<TEvent>[] | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    const filtered = this.rows.filter((row) => row.globalPosition >= globalPosition);
    return limit !== undefined ? filtered.slice(0, limit) : filtered;
  }

  async loadStreamFrom(
    streamKey: StreamKey,
    fromVersion: number,
  ): Promise<StoredEvent<TEvent>[] | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    return this.rows.filter(
      (row) => row.streamKey === streamKey && row.streamVersion >= fromVersion,
    );
  }

  async append(events: TEvent[]): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    for (const event of events) {
      const streamKey: StreamKey = `${event.aggregateType}#${event.aggregateId}`;
      const streamVersion = this.rows.filter((e) => e.streamKey === streamKey).length + 1;
      this.rows.push({
        stream: event.aggregateType,
        streamKey,
        streamVersion,
        globalPosition: this.rows.length + 1,
        insertedAt: Date.now(),
        event,
      });
    }
  }
}
