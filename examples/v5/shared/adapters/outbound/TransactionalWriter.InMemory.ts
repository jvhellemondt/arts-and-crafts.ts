import type { AppendEventsAndIntents } from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type {
  FaultSimulationMode,
  SimulateFaults,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure, Notification } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { DomainEvent, Intent } from "@arts-and-crafts/v5/core/shapes";
import { errAsync, type ResultAsync } from "neverthrow";
import type { InMemoryEventStore } from "./EventStore.InMemory.ts";
import type { InMemoryOutbox } from "./Outbox.InMemory.ts";

/**
 * Persists domain events and intents atomically by composing an event store
 * and an outbox that share one failure domain: if either is faulted, neither
 * write happens. Once the shared fault gate has passed, the two underlying
 * writes are synchronous in-memory pushes with no `await` between them, so
 * nothing else can interleave — the pair commits as a single unit, the same
 * guarantee a database transaction gives two INSERTs into the same
 * connection. This is what makes the "same transaction" claim in ADR-0003
 * concrete instead of aspirational (see docs/adr/011 for the full writeup).
 */
export class InMemoryTransactionalWriter<
  TEvent extends DomainEvent,
  TIntent extends Intent,
  TNotification extends Notification = never,
>
  implements
    AppendEventsAndIntents<TEvent, TIntent, ResultAsync<void, GatewayFailure>>,
    SimulateFaults
{
  constructor(
    private readonly eventStore: InMemoryEventStore<TEvent>,
    private readonly outbox: InMemoryOutbox<TIntent, TNotification>,
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

  private offlineFailure(): GatewayFailure {
    return {
      kind: "failure",
      code: "GATEWAY_FAILURE",
      gateway: "InMemoryTransactionalWriter",
      reason: "The store is offline — neither events nor intents were persisted",
    };
  }

  appendEventsAndIntents(events: TEvent[], intents: TIntent[]): ResultAsync<void, GatewayFailure> {
    if (this.isSimulating) return errAsync(this.offlineFailure());

    return this.eventStore.append(events).andThen(() => this.outbox.stage(intents));
  }
}
