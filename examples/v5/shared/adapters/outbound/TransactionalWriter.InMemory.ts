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
        .mapErr((failure): GatewayFailure => ({ ...failure, code: "GATEWAY_FAILURE" }))
        .andThen(() => this.outbox.stage(decision.intents))
        .andThen(() => this.datasource.commit())
        .orElse((failure) => this.datasource.rollback().andThen(() => errAsync(failure))),
    );
  }
}
