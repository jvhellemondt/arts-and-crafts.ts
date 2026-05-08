import type { AppendToStream } from "@adapters/outbound/capabilities/AppendToStream.ts";
import type { LoadsDomainEvents } from "@adapters/outbound/capabilities/LoadsDomainEvents.ts";
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
    LoadsDomainEvents<TEvent, Promise<TEvent[] | GatewayFailure>>,
    AppendToStream<TEvent, Promise<void | GatewayFailure>>,
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

  async load(streamName: string, aggregateId: string): Promise<TEvent[] | GatewayFailure> {
    if (this.activeFault === "offline") {
      return {
        kind: "GatewayFailure",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      };
    }

    const streamKey: StreamKey = `${streamName}#${aggregateId}`;
    return this.rows
      .filter((envelope) => envelope.streamKey === streamKey)
      .map((envelope) => envelope.event);
  }

  async append(
    streamName: string,
    aggregateId: string,
    events: TEvent[],
  ): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") {
      return {
        kind: "GatewayFailure",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      };
    }

    for (const event of events) {
      const streamKey: StreamKey = `${streamName}#${aggregateId}`;
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
