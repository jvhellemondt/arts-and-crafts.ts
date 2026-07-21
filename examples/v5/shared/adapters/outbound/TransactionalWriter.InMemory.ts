import type { PersistEventsAndIntents } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure, Notification } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent, EventsAndIntents, Intent } from "@arts-and-crafts/v5/core/shapes";
import type { ResultAsync } from "neverthrow";
import type { InMemoryDatasource } from "./InMemoryDatasource.ts";
import type { InMemoryEventStore } from "./EventStore.InMemory.ts";
import type { InMemoryOutbox } from "./Outbox.InMemory.ts";

/**
 * Persists an events+intents pairing atomically: opens a transaction on the
 * shared datasource, appends the events, stages the intents, then commits —
 * or rolls back if either step failed.
 *
 * `eventStore` and `outbox` must be constructed against the same
 * `datasource` (see `InMemoryDatasource.ts`). Opening the transaction here
 * means their writes only stage rather than land immediately for the
 * duration of this call; a write made outside of `persist()` (e.g. staging a
 * standalone rejection notification directly on the same outbox) still
 * commits immediately, since the datasource sits in autocommit mode whenever
 * no transaction is open. If `append` or `stage` fails, whatever the other
 * already staged is discarded via `rollback()` instead of becoming visible —
 * real atomicity, not a pre-flight guess. This is what makes the "same
 * transaction" claim in ADR-0005 concrete instead of aspirational (see
 * packages/v5/docs/adr/0010-events-and-intents-persist-atomically.md for the
 * full writeup).
 */
export class InMemoryTransactionalWriter<
  TEvent extends DomainEvent,
  TIntent extends Intent,
  TNotification extends Notification = never,
>
  implements
    PersistEventsAndIntents<TEvent, TIntent, ResultAsync<void, GatewayFailure>>,
    SimulateFaults
{
  constructor(
    private readonly eventStore: InMemoryEventStore<TEvent>,
    private readonly outbox: InMemoryOutbox<TIntent, TNotification>,
    private readonly datasource: InMemoryDatasource,
  ) {}

  simulate(mode: "offline"): void {
    this.eventStore.simulate(mode);
    this.outbox.simulate(mode);
  }

  restore(): void {
    this.eventStore.restore();
    this.outbox.restore();
  }

  get isSimulating(): boolean {
    return this.eventStore.isSimulating || this.outbox.isSimulating;
  }

  get activeFault(): FaultSimulationMode | undefined {
    return this.eventStore.activeFault ?? this.outbox.activeFault;
  }

  persist({
    events,
    intents,
  }: EventsAndIntents<TEvent, TIntent>): ResultAsync<void, GatewayFailure> {
    this.datasource.begin();
    return this.eventStore
      .append(events)
      .andThen(() => this.outbox.stage(intents))
      .map(() => this.datasource.commit())
      .mapErr((failure) => {
        this.datasource.rollback();
        return failure;
      });
  }
}
