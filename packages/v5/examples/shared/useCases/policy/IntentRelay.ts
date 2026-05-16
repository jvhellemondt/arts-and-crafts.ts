import type { HandleIntent } from "@useCases/policy/capabilities/HandleIntent.ts";
import type { LoadPendingIntents } from "@adapters/outbound/capabilities/LoadPendingIntents.ts";
import type { MarkIntentDispatched } from "@adapters/outbound/capabilities/MarkIntentDispatched.ts";
import type { MarkIntentFailed } from "@adapters/outbound/capabilities/MarkIntentFailed.ts";
import type { RelayPendingIntents } from "@useCases/policy/capabilities/RelayPendingIntents.ts";
import type { Intent } from "@core/shapes/Intent.ts";
import { isFailure } from "@examples/shared/utils/isFailure.ts";

type IntentOutbox<TIntent extends Intent> =
  & LoadPendingIntents<TIntent>
  & MarkIntentDispatched
  & MarkIntentFailed;

export class IntentRelay<TIntent extends Intent> implements RelayPendingIntents {
  constructor(
    private readonly outbox: IntentOutbox<TIntent>,
    private readonly handlers: Map<string, HandleIntent<TIntent>>,
    private readonly batchSize: number = 100,
  ) {}

  async relay(): Promise<void> {
    const pending = await this.outbox.loadPending(this.batchSize);
    if (isFailure(pending)) return;

    for (const envelope of pending) {
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
      }
      catch (cause) {
        const reason = cause instanceof Error ? cause.message : String(cause);
        await this.outbox.markFailed(envelope.entry.id, reason);
      }
    }
  }
}
