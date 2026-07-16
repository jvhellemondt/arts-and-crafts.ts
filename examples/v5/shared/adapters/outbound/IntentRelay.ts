import type {
  HandleIntent,
  RelayPendingIntents,
} from "@arts-and-crafts/v5/useCases/policy/capabilities";
import type {
  LoadPendingIntents,
  MarkIntentDispatched,
  MarkIntentFailed,
} from "@arts-and-crafts/v5/adapters/outbound/capabilities";
import type { GatewayFailure, OutboxEnvelope } from "@arts-and-crafts/v5/adapters/outbound/shapes";
import type { Intent } from "@arts-and-crafts/v5/core/shapes";
import type { ResultAsync } from "neverthrow";

type IntentOutbox<TIntent extends Intent> = LoadPendingIntents<
  TIntent,
  ResultAsync<OutboxEnvelope<TIntent>[], GatewayFailure>
> &
  MarkIntentDispatched<ResultAsync<void, GatewayFailure>> &
  MarkIntentFailed<ResultAsync<void, GatewayFailure>>;

export class IntentRelay<TIntent extends Intent> implements RelayPendingIntents {
  constructor(
    private readonly outbox: IntentOutbox<TIntent>,
    private readonly handlers: Map<string, HandleIntent<TIntent>>,
    private readonly batchSize: number = 100,
  ) {}

  async relay(): Promise<void> {
    const pending = await this.outbox.loadPending(this.batchSize);
    if (pending.isErr()) return;

    for (const envelope of pending.value) {
      const handler = this.handlers.get(envelope.entry.type);
      if (!handler) {
        await this.outbox.markFailed(
          envelope.entry.id,
          `No handler registered for intent type "${envelope.entry.type}"`,
        );
        continue;
      }

      try {
        await handler.handle(envelope.entry);
        await this.outbox.markDispatched(envelope.entry.id);
      } catch (cause) {
        const reason = cause instanceof Error ? cause.message : String(cause);
        await this.outbox.markFailed(envelope.entry.id, reason);
      }
    }
  }
}
