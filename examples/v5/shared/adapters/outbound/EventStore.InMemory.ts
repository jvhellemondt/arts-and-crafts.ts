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

/**
 * Modelled as two SQL tables would be: `events` (the append-only physical row
 * store, exposed via `datasource`/`rows`) and `event_tags` (a `(concern,
 * event_id)` join table, `concernIndex`). `load()` performs the same two-step
 * lookup a SQL implementation would: resolve concerns to candidate event ids
 * via the tag table, then join back to the events table.
 *
 * `concernIndex` assumes `datasource` is empty at construction — it is only
 * ever built incrementally via `append()`, not rebuilt from pre-seeded rows.
 */
export class InMemoryEventStore<TEvent extends DomainEvent>
  implements
    LoadDomainEvents<TEvent, Promise<TEvent[] | GatewayFailure>>,
    LoadEventsFrom<TEvent>,
    AppendToEventStore<TEvent, Promise<void | GatewayFailure>>,
    SimulateFaults
{
  private readonly tableName: string = "event_store";
  private readonly concernIndex = new Map<StreamKey, string[]>();
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

  private indexConcerns(row: StoredEvent<TEvent>): void {
    for (const concern of row.concerns) {
      const eventIds = this.concernIndex.get(concern);
      if (eventIds) eventIds.push(row.event.id);
      else this.concernIndex.set(concern, [row.event.id]);
    }
  }

  private candidateEventIds(concerns: readonly StreamKey[]): Set<string> {
    const eventIds = new Set<string>();
    for (const concern of concerns) {
      for (const eventId of this.concernIndex.get(concern) ?? []) eventIds.add(eventId);
    }
    return eventIds;
  }

  async load(concerns: readonly StreamKey[]): Promise<TEvent[] | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    // Step 1: event_tags lookup — resolve requested concerns to candidate event
    // ids, mirroring `SELECT DISTINCT event_id FROM event_tags WHERE concern IN (...)`.
    const eventIds = this.candidateEventIds(concerns);

    // Step 2: join back to the events table, in append order —
    // mirroring `SELECT * FROM events WHERE id IN (...) ORDER BY global_position`.
    return this.rows.filter((row) => eventIds.has(row.event.id)).map((row) => row.event);
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
      const row: StoredEvent<TEvent> = {
        concerns: event.concerns,
        globalPosition: this.rows.length + 1,
        insertedAt: Date.now(),
        event,
      };
      this.rows.push(row);
      this.indexConcerns(row);
    }
  }
}
