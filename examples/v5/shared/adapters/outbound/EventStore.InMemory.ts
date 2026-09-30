import type {
  AppendToEventStore,
  LoadDomainEvents,
  LoadEventsFrom,
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type {
  DynamicConsistencyResult,
  GatewayFailure,
  StoredEvent,
  StreamKey,
} from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent, Failure } from "@arts-and-crafts/v5/core/shapes";
import { ResultAsync, errAsync, okAsync } from "neverthrow";
import { EVENT_STORE_TABLE, EVENT_TAGS_TABLE, InMemoryDatasource } from "./InMemoryDatasource.ts";

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

export type AppendFailure =
  | GatewayFailure
  | (Failure<"CONCURRENCY_CONFLICT"> & { readonly gateway: string });

export class InMemoryEventStore<TEvent extends DomainEvent>
  implements
    LoadDomainEvents<TEvent, ResultAsync<DynamicConsistencyResult<TEvent>, GatewayFailure>>,
    LoadEventsFrom<TEvent, ResultAsync<StoredEvent<TEvent>[], GatewayFailure>>,
    AppendToEventStore<TEvent, ResultAsync<void, AppendFailure>>,
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

  private eventRows(): ResultAsync<EventStoreRow<TEvent>[], GatewayFailure> {
    return this.datasource.read<EventStoreRow<TEvent>>(EVENT_STORE_TABLE);
  }

  private tagRows(): ResultAsync<EventTagRow[], GatewayFailure> {
    return this.datasource.read<EventTagRow>(EVENT_TAGS_TABLE);
  }

  private offlineFailure(): GatewayFailure {
    return {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryEventStore",
      reason: "The Eventstore has been set to offline mode",
    };
  }

  private candidateEventIds(
    concerns: readonly StreamKey[],
  ): ResultAsync<Set<string>, GatewayFailure> {
    return this.tagRows().map((tagRows) => {
      const eventIds = new Set<string>();
      for (const tag of tagRows) {
        if (concerns.includes(tag.data.concern)) eventIds.add(tag.data.eventId);
      }
      return eventIds;
    });
  }

  private versionsFor(
    concerns: readonly StreamKey[],
  ): ResultAsync<Record<StreamKey, number>, GatewayFailure> {
    return this.tagRows().map((tagRows) =>
      Object.fromEntries(
        concerns.map((concern) => [
          concern,
          tagRows.filter((tag) => tag.data.concern === concern).length,
        ]),
      ),
    );
  }

  load(
    concerns: readonly StreamKey[],
  ): ResultAsync<DynamicConsistencyResult<TEvent>, GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    return this.candidateEventIds(concerns)
      .andThen((eventIds) =>
        this.eventRows().map((rows) =>
          rows.filter((row) => eventIds.has(row.data.event.id)).map((row) => row.data.event),
        ),
      )
      .andThen((events) => this.versionsFor(concerns).map((versions) => ({ events, versions })));
  }

  loadFrom(
    globalPosition: number,
    limit?: number,
  ): ResultAsync<StoredEvent<TEvent>[], GatewayFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    return this.eventRows().map((rows) => {
      const filtered = rows
        .filter((row) => row.data.globalPosition >= globalPosition)
        .map((row) => row.data);
      return limit !== undefined ? filtered.slice(0, limit) : filtered;
    });
  }

  append(events: TEvent[], versions?: Record<StreamKey, number>): ResultAsync<void, AppendFailure> {
    if (this.activeFault === "offline") return errAsync(this.offlineFailure());

    return this.guardVersions(versions).andThen(() => this.appendUnchecked(events));
  }

  private guardVersions(
    versions: Record<StreamKey, number> | undefined,
  ): ResultAsync<void, AppendFailure> {
    if (versions === undefined) return okAsync(undefined);

    const guarded = Object.keys(versions) as StreamKey[];

    return this.versionsFor(guarded).andThen((current) => {
      const stale = guarded.filter((concern) => current[concern] !== versions[concern]);
      if (stale.length === 0) return okAsync(undefined);

      return errAsync({
        kind: "failure" as const,
        code: "CONCURRENCY_CONFLICT" as const,
        gateway: "InMemoryEventStore",
        reason: `concern(s) moved on since they were read: ${stale.join(", ")}`,
      });
    });
  }

  private appendUnchecked(events: TEvent[]): ResultAsync<void, GatewayFailure> {
    return this.eventRows().andThen((existingRows) => {
      let nextPosition = existingRows.length + 1;
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
      return this.datasource
        .write(EVENT_STORE_TABLE, eventRows)
        .andThen(() => this.datasource.write(EVENT_TAGS_TABLE, tagRows));
    });
  }
}
