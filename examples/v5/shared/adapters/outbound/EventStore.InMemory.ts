import type {
  AppendToEventStore,
  LoadDomainEvents,
  LoadEventsFrom,
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type {
  GatewayFailure,
  StoredEvent,
  StreamKey,
} from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent } from "@arts-and-crafts/v5/core/shapes";

export class InMemoryEventStore<TEvent extends DomainEvent>
  implements
    LoadDomainEvents<TEvent, Promise<TEvent[] | GatewayFailure>>,
    LoadEventsFrom<TEvent>,
    AppendToEventStore<TEvent, Promise<void | GatewayFailure>>,
    SimulateFaults
{
  private readonly tableName: string = "event_store";
  private simulation?: FaultSimulationMode;
  private readonly datasource: Map<string, StoredEvent<TEvent>[]>;

  constructor(datasource: Map<string, StoredEvent<TEvent>[]> = new Map()) {
    this.datasource = datasource;
  }

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
