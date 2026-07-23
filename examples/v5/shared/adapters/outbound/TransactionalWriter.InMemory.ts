import type { PersistDecision } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure, Notification } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent, Intent, Rejection } from "@arts-and-crafts/v5/core/shapes";
import type { Command, Decision } from "@arts-and-crafts/v5/useCases/command/shapes";
import { toRejectionNotification } from "@arts-and-crafts/v5-utils/adapters/outbound";
import { errAsync, type ResultAsync } from "neverthrow";
import type { InMemoryDatasource } from "./InMemoryDatasource.ts";
import type { InMemoryEventStore } from "./EventStore.InMemory.ts";
import type { InMemoryOutbox } from "./Outbox.InMemory.ts";

/**
 * Persists a decision's outcome as one unit, given the command that produced
 * it:
 *
 * - **Accepted** — opens a transaction on the shared datasource, appends the
 *   events, stages the intents, then commits — or rolls back if either step
 *   failed. `eventStore` and `outbox` must be constructed against the same
 *   `datasource` (see `InMemoryDatasource.ts`); opening the transaction here
 *   means their writes only stage rather than land immediately for the
 *   duration of this call. A write made outside of `persist()` (e.g. a
 *   standalone stage directly on the same outbox) still commits immediately,
 *   since the datasource sits in autocommit mode whenever no transaction is
 *   open. If `append` or `stage` fails, whatever the other already staged is
 *   discarded via `rollback()` instead of becoming visible — real atomicity,
 *   not a pre-flight guess.
 * - **Rejected** — builds a caller notification via
 *   `@arts-and-crafts/v5-utils`'s `toRejectionNotification` (command +
 *   rejection in, notification out — nothing adapter-specific) and stages
 *   it. No transaction: nothing else needs to commit alongside a standalone
 *   notification.
 *
 * This is what makes the "same transaction" claim in ADR-0005 concrete
 * instead of aspirational (see
 * packages/v5/docs/adr/0010-events-and-intents-persist-atomically.md for the
 * full writeup).
 */
export class InMemoryTransactionalWriter<
  TCommand extends Command,
  TEvent extends DomainEvent,
  TIntent extends Intent,
  TRejection extends Rejection,
  TNotification extends Notification,
>
  implements
    PersistDecision<TCommand, TEvent, TIntent, TRejection, ResultAsync<void, GatewayFailure>>,
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

  persist(
    decision: Decision<TEvent, TIntent, TRejection>,
    command: TCommand,
  ): ResultAsync<void, GatewayFailure> {
    if (!decision.accepted) {
      const notification = toRejectionNotification<TNotification>(command, decision.rejection);
      return this.outbox.stage([notification]);
    }

    return this.datasource.begin().andThen(() =>
      this.eventStore
        .append(decision.events)
        .andThen(() => this.outbox.stage(decision.intents))
        .andThen(() => this.datasource.commit())
        .orElse((failure) => this.datasource.rollback().andThen(() => errAsync(failure))),
    );
  }
}
