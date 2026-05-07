import type { AppendsDomainEvents } from "@adapters/outbound/capabilities/AppendsDomainEvents.ts";
import type { LoadsDomainEvents } from "@adapters/outbound/capabilities/LoadsDomainEvents.ts";
import type {
  FaultSimulationMode,
  SimulatesFaults,
} from "@adapters/outbound/capabilities/SimulatesFaults.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { StoredEvent } from "@adapters/outbound/shapes/StoredEvent.ts";
import type { StreamKey } from "@adapters/outbound/shapes/StreamKey.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

export class InMemoryEventStore<TEvent extends DomainEvent>
  implements
    LoadsDomainEvents<TEvent, Promise<TEvent[] | GatewayFailure>>,
    AppendsDomainEvents<TEvent, Promise<void | GatewayFailure>>,
    SimulatesFaults
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

  async append(domainEvents: TEvent[]): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") {
      return {
        kind: "GatewayFailure",
        gateway: "InMemoryEventStore",
        reason: "The Eventstore has been set to offline mode",
      };
    }

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
