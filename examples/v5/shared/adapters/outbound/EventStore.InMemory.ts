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
import { EVENT_STORE_TABLE, EVENT_TAGS_TABLE, InMemoryDatasource } from "./InMemoryDatasource.ts";

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

/**
 * Modelled as two SQL tables would be: `event_store` (the append-only physical
 * row store) and `event_tags` (a `(concern, event_id)` join table). Both live
 * in the same `datasource`, keyed by table name — so the datasource genuinely
 * represents "a database" as `table name -> rows[]`, not just the events
 * table. Pass the same `InMemoryDatasource` given to an `InMemoryOutbox` (in
 * `"atomic"` mode) to have both stores participate in one atomic write via
 * `InMemoryTransactionalWriter` — see `InMemoryDatasource.ts`.
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

  constructor(private readonly datasource: InMemoryDatasource = new InMemoryDatasource()) {}

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

  private get eventRows(): EventStoreRow<TEvent>[] {
    return this.datasource.read(EVENT_STORE_TABLE);
  }

  private get tagRows(): EventTagRow[] {
    return this.datasource.read(EVENT_TAGS_TABLE);
  }

  private offlineFailure(): GatewayFailure {
    return {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryEventStore",
      reason: "The Eventstore has been set to offline mode",
    };
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

    let nextPosition = this.eventRows.length + 1;
    const eventRows: EventStoreRow<TEvent>[] = [];
    const tagRows: EventTagRow[] = [];
    for (const event of events) {
      const row: EventStoreRow<TEvent> = {
        table: EVENT_STORE_TABLE,
        data: {
          concerns: event.concerns,
          globalPosition: nextPosition++,
          insertedAt: Date.now(),
          event,
        },
      };
      eventRows.push(row);
      for (const concern of event.concerns) {
        tagRows.push({ table: EVENT_TAGS_TABLE, data: { concern, eventId: event.id } });
      }
    }
    this.datasource.write(EVENT_STORE_TABLE, eventRows);
    this.datasource.write(EVENT_TAGS_TABLE, tagRows);
    return okAsync(undefined);
  }
}
