import type { AppendToEventStream } from "@adapters/outbound/capabilities/AppendToEventStream.ts";
import type { LoadEventsFrom } from "@adapters/outbound/capabilities/LoadEventsFrom.ts";
import type { ReadEvents } from "@adapters/outbound/capabilities/ReadEvents.ts";
import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@adapters/outbound/capabilities/SimulateFaults.ts";
import type { AppendCondition } from "@adapters/outbound/shapes/AppendCondition.ts";
import type { AppendConflict } from "@adapters/outbound/shapes/AppendConflict.ts";
import type { Criterion, DcbQuery } from "@adapters/outbound/shapes/DcbQuery.ts";
import type { GatewayFailure } from "@adapters/outbound/shapes/GatewayFailure.ts";
import type { ReadResult } from "@adapters/outbound/shapes/ReadResult.ts";
import type { StoredEvent } from "@adapters/outbound/shapes/StoredEvent.ts";
import type { DomainEvent } from "@core/shapes/DomainEvent.ts";

function matchesCriterion(event: DomainEvent, criterion: Criterion): boolean {
  const typeMatches = criterion.types === undefined || criterion.types.includes(event.type);
  const tagsMatch = criterion.tags.every((tag) =>
    event.tags.some((eventTag) => eventTag.key === tag.key && eventTag.value === tag.value),
  );
  return typeMatches && tagsMatch;
}

function matchesQuery(event: DomainEvent, query: DcbQuery): boolean {
  return query.criteria.some((criterion) => matchesCriterion(event, criterion));
}

export class InMemoryEventStore<TEvent extends DomainEvent>
  implements
    ReadEvents<TEvent>,
    LoadEventsFrom<TEvent>,
    AppendToEventStream<TEvent, Promise<void | GatewayFailure | AppendConflict>>,
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

  async read(query: DcbQuery): Promise<ReadResult<TEvent> | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    const events = this.rows
      .filter((row) => matchesQuery(row.event, query))
      .map((row) => row.event);
    return { events, position: this.rows.length };
  }

  async loadFrom(
    globalPosition: number,
    limit?: number,
  ): Promise<StoredEvent<TEvent>[] | GatewayFailure> {
    if (this.activeFault === "offline") return this.offlineFailure();

    const filtered = this.rows.filter((row) => row.globalPosition >= globalPosition);
    return limit !== undefined ? filtered.slice(0, limit) : filtered;
  }

  async append(
    events: TEvent[],
    condition?: AppendCondition,
  ): Promise<void | GatewayFailure | AppendConflict> {
    if (this.activeFault === "offline") return this.offlineFailure();

    if (condition !== undefined) {
      const conflict = this.rows.some(
        (row) => row.globalPosition > condition.after && matchesQuery(row.event, condition.query),
      );
      if (conflict) {
        return {
          kind: "failure",
          code: "APPEND_CONDITION_FAILED",
          reason: `An event matching the append condition was stored after position ${condition.after}`,
        };
      }
    }

    for (const event of events) {
      this.rows.push({
        globalPosition: this.rows.length + 1,
        insertedAt: Date.now(),
        event,
      });
    }
  }
}
