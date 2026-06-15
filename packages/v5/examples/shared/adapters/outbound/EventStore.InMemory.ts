import type { AppendToEventStore } from "@adapters/outbound/capabilities/AppendToEventStore.ts";
import type { LoadDomainEvents } from "@adapters/outbound/capabilities/LoadDomainEvents.ts";
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

  async load(concerns: readonly StreamKey[]): Promise<TEvent[] | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    return this.rows
      .filter((envelope) => envelope.concerns.some((concern) => concerns.includes(concern)))
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

  async append(events: TEvent[]): Promise<void | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    for (const event of events) {
      this.rows.push({
        concerns: event.concerns,
        globalPosition: this.rows.length + 1,
        insertedAt: Date.now(),
        event,
      });
    }
  }
}
