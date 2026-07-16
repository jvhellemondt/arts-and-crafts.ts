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
import { ResultAsync, errAsync, okAsync } from "neverthrow";

const EVENT_STORE_TABLE = "event_store";
const EVENT_TAGS_TABLE = "event_tags";

/** A single `(concern, event_id)` pairing — one row of the `event_tags` join table. */
type EventTag = {
  readonly concern: StreamKey;
  readonly eventId: string;
};

type EventStoreRow<TEvent extends DomainEvent> = {
  readonly table: typeof EVENT_STORE_TABLE;
  readonly data: StoredEvent<TEvent>;
};

type EventTagRow = {
  readonly table: typeof EVENT_TAGS_TABLE;
  readonly data: EventTag;
};

/** Discriminated union over every table's row shape, tagged by `table`. */
export type TableRow<TEvent extends DomainEvent> = EventStoreRow<TEvent> | EventTagRow;
export type TableName = TableRow<never>["table"];

/**
 * Modelled as two SQL tables would be: `event_store` (the append-only physical
 * row store) and `event_tags` (a `(concern, event_id)` join table). Both live
 * in the same `datasource` map, keyed by table name, with `TableRow` as a
 * discriminated union over each table's row shape — so the map genuinely
 * represents "a database" as `table name -> rows[]`, not just the events table.
 *
 * `load()` performs the same two-step lookup a SQL implementation would:
 * resolve concerns to candidate event ids via the tag table, then join back
 * to the events table.
 */
export class InMemoryEventStore<TEvent extends DomainEvent>
  implements
    LoadDomainEvents<TEvent, ResultAsync<TEvent[], GatewayFailure>>,
    LoadEventsFrom<TEvent, ResultAsync<StoredEvent<TEvent>[], GatewayFailure>>,
    AppendToEventStore<TEvent, ResultAsync<void, GatewayFailure>>,
    SimulateFaults
{
  private simulation?: FaultSimulationMode;

  constructor(private readonly datasource: Map<TableName, TableRow<TEvent>[]> = new Map()) {}

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

  private table<T extends TableName>(name: T): Extract<TableRow<TEvent>, { table: T }>[] {
    if (!this.datasource.has(name)) this.datasource.set(name, []);
    return this.datasource.get(name)! as Extract<TableRow<TEvent>, { table: T }>[];
  }

  private get eventRows(): EventStoreRow<TEvent>[] {
    return this.table(EVENT_STORE_TABLE);
  }

  private get tagRows(): EventTagRow[] {
    return this.table(EVENT_TAGS_TABLE);
  }

  private offlineFailure(): GatewayFailure {
    return {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryEventStore",
      reason: "The Eventstore has been set to offline mode",
    };
  }

  private indexConcerns(row: EventStoreRow<TEvent>): void {
    for (const concern of row.data.concerns) {
      this.tagRows.push({
        table: EVENT_TAGS_TABLE,
        data: { concern, eventId: row.data.event.id },
      });
    }
  }

  private candidateEventIds(concerns: readonly StreamKey[]): Set<string> {
    // Step 1: event_tags lookup — mirrors
    // `SELECT DISTINCT event_id FROM event_tags WHERE concern IN (...)`.
    const eventIds = new Set<string>();
    for (const tag of this.tagRows) {
      if (concerns.includes(tag.data.concern)) eventIds.add(tag.data.eventId);
    }
    return eventIds;
  }

  load(concerns: readonly StreamKey[]): ResultAsync<TEvent[], GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    const eventIds = this.candidateEventIds(concerns);

    // Step 2: join back to the events table, in append order —
    // mirrors `SELECT * FROM events WHERE id IN (...) ORDER BY global_position`.
    return okAsync(
      this.eventRows.filter((row) => eventIds.has(row.data.event.id)).map((row) => row.data.event),
    );
  }

  loadFrom(
    globalPosition: number,
    limit?: number,
  ): ResultAsync<StoredEvent<TEvent>[], GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    const filtered = this.eventRows
      .filter((row) => row.data.globalPosition >= globalPosition)
      .map((row) => row.data);
    return okAsync(limit !== undefined ? filtered.slice(0, limit) : filtered);
  }

  append(events: TEvent[]): ResultAsync<void, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    for (const event of events) {
      const row: EventStoreRow<TEvent> = {
        table: EVENT_STORE_TABLE,
        data: {
          concerns: event.concerns,
          globalPosition: this.eventRows.length + 1,
          insertedAt: Date.now(),
          event,
        },
      };
      this.eventRows.push(row);
      this.indexConcerns(row);
    }
    return okAsync(undefined);
  }
}
